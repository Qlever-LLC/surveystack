<template>
  <v-card v-if="!signInLinkSent" class="pa-6 card-width">
    <div class="d-sm-flex justify-center">
      <div class="pl-sm-5 pr-sm-10 py-6">
        <h1 class="heading--text text-center" v-if="isWhitelabel">Login &amp; Join {{ whitelabelPartner.name }}</h1>
        <h1 class="heading--text" v-else>Welcome Back!</h1>
        <v-form>
          <v-text-field
            label="E-Mail"
            type="text"
            class="form-control"
            :value="entity.email"
            @input="entity.email = $event.toLowerCase()"
            color="focus"
          />
          <div v-if="!usePassword" class="font-italic text-body-2 mb-4">
            We'll send you an email to sign you in - no password needed! <b>Click send</b> then <b>check your email</b>.
          </div>
          <v-text-field
            v-if="usePassword"
            label="Password"
            :type="passwordInputType"
            class="form-control"
            v-model="entity.password"
            :append-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="showPasswords = !showPasswords"
            color="focus"
          />
          <div class="d-flex justify-space-around align-center">
            <template v-if="usePassword">
              <router-link
                v-if="useLink"
                :to="{
                  name: 'auth-forgot-password',
                  query: { email: entity.email },
                }"
                class="white-space-nowrap font-weight-medium mr-4"
                role="link"
                >Forgot password?</router-link
              >
              <a
                v-else
                text
                @click.stop="$emit('updateActive', 'forgot-password')"
                class="white-space-nowrap font-weight-medium mr-4"
                role="button"
                >Forgot password?</a
              >
            </template>
            <v-btn type="submit" @click.prevent="handleSubmitClick" color="primary" :loading="isSubmitting">{{
              usePassword ? 'Login' : 'Send Link'
            }}</v-btn>
          </div>
        </v-form>
        <div class="text-center text-muted mt-5">
          <v-btn
            text
            small
            color="primary"
            @click="
              usePassword = !usePassword;
              status = null;
            "
            data-testid="toggle-method"
          >
            {{ usePassword ? 'email me a sign in link instead' : 'sign in with password instead' }}
          </v-btn>
        </div>
      </div>
      <template v-if="registrationEnabled">
        <div class="d-flex flex-sm-column align-center justify-space-around" data-testid="separator">
          <div class="line"></div>
          Or
          <div class="line"></div>
        </div>
        <div class="d-flex justify-center pr-sm-5 pl-sm-10 py-6 d-flex flex-column align-center flex-wrap">
          <p class="white-space-nowrap">Don't have an account?</p>
          <v-btn v-if="useLink" :to="registerLink" color="primary" class="px-8" role="link"> Register now </v-btn>
          <v-btn v-else @click.stop="$emit('updateActive', 'register')" color="primary" class="px-8" role="button">
            Register now
          </v-btn>
        </div>
      </template>
    </div>

    <v-alert v-if="status" class="mt-4" mode="fade" text type="error">{{ status }}</v-alert>
  </v-card>
  <v-alert
    v-else
    icon="mdi-email-fast"
    prominent
    colored-border
    color="success"
    border="left"
    elevation="2"
    class="card-width mb-0"
  >
    <h1>Magic link sent!</h1>
    <p class="body-1 my-6">
      Follow the link we sent you at <span class="font-weight-medium">{{ entity.email }}</span> to finish logging in!
    </p>
    <div class="text-right text-muted mt-5">
      <v-btn text small @click="signInLinkSent = false"> Back to login </v-btn>
    </div>
  </v-alert>
</template>

<script>
import api from '@/services/api.service';
import { get } from 'lodash';

const DEFAULT_ENTITY = {
  email: '',
  password: '',
};

// LocalStorage key for saving the preferred login method
const LS_DEFAULT_USE_PASSWORD = 'use-password-on-login-page-by-default';

export default {
  props: {
    initialEmail: {
      type: String,
      required: false,
    },
    // true: start with user/pw login, false: start with magic link login
    defaultUsePassword: {
      type: Boolean,
      default: null,
    },
    useLink: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      status: '',
      showPasswords: false,
      entity: {
        ...DEFAULT_ENTITY,
      },
      registrationEnabled: false,
      usePassword:
        this.defaultUsePassword !== null ? this.defaultUsePassword : localStorage[LS_DEFAULT_USE_PASSWORD] === 'true',
      signInLinkSent: false,
      isSubmitting: false,
    };
  },
  computed: {
    passwordInputType() {
      return this.showPasswords ? 'text' : 'password';
    },
    registerLink() {
      const link = {
        name: 'auth-register',
        params: {
          initialEmail: this.entity.email,
          initialPassword: this.entity.password,
        },
      };

      if (this.$route.params && this.$route.params.redirect) {
        link.params.redirect = this.$route.params.redirect;
      }

      return link;
    },
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
    },
    whitelabelPartner() {
      return this.$store.getters['whitelabel/partner'];
    },
  },
  async created() {
    if (this.initialEmail) {
      this.entity.email = this.initialEmail;
    }

    if ('magicLinkExpired' in this.$route.query) {
      this.status = 'Your magic link is expired. Please request a new one.';
      // Select the magic link login variation of the dialog
      this.usePassword = false;
    }

    if (this.isWhitelabel) {
      const { data } = await api.get(`/groups/${this.whitelabelPartner.id}`);
      if (!data.meta.invitationOnly) {
        this.registrationEnabled = true;
      }
    } else {
      this.registrationEnabled = true;
    }
  },
  methods: {
    async handleSubmitClick() {
      this.isSubmitting = true;
      try {
        await this.submit();
      } finally {
        this.isSubmitting = false;
      }
    },
    async submit() {
      if (this.entity.email === '') {
        this.status = 'E-Mail must not be empty.';
        return;
      }

      // email sign-in link
      if (!this.usePassword) {
        const landingPath = this.$route.params.redirect || this.$route.query.landingPath;
        const callbackUrl = this.$route.query.callbackUrl;

        try {
          await this.$store.dispatch('auth/sendMagicLink', { email: this.entity.email, landingPath, callbackUrl });
          this.signInLinkSent = true;
          this.status = '';
        } catch (e) {
          this.status = get(e, 'response.data.message') || 'An error occured, please try again later.';
        }
        return;
      }

      if (this.entity.password === '') {
        this.status = 'Password must not be empty.';
        return;
      }

      try {
        await this.$store.dispatch('auth/login', {
          url: '/auth/login',
          user: this.entity,
        });
      } catch (error) {
        switch (error.response.status) {
          case 401:
            this.status = 'Invalid email or password'; //error.response.data.message;
            break;
          case 404:
            this.status = 'Invalid email or password'; //error.response.data.message;
            break;
          default:
            this.status = 'An error occured'; //'Unknown error :/';
        }
        return;
      }

      this.$store.dispatch('surveys/fetchPinned');
      this.$store.dispatch('submissions/initialize');

      if (this.$route.params.redirect) {
        this.$router.push(this.$route.params.redirect);
      } else {
        this.$router.push('/');
      }
    },
  },
  watch: {
    usePassword(newValue) {
      localStorage[LS_DEFAULT_USE_PASSWORD] = newValue;
    },
  },
};
</script>

<style scoped>
a {
  text-decoration: none;
}

.line {
  border-top: 2px solid rgb(180, 180, 180);
  width: 40%;
  margin-top: -1px;
}
.card-width {
  max-width: min(600px, 92vw);
}
@media (min-width: 600px) {
  .line {
    /* reset previous values */
    border-top: none;
    width: auto;
    margin-top: 0;
    border-left: 2px solid rgb(180, 180, 180);
    height: 40%;
    margin-left: -1px;
  }
}
</style>
