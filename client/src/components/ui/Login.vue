<template>
  <a-card v-if="!signInLinkSent" class="pa-6 card-width">
    <div class="d-sm-flex justify-center">
      <div class="pl-sm-5 pr-sm-10 py-6">
        <h1 class="text-heading text-center" v-if="isWhitelabel">Login &amp; Join {{ whitelabelPartner.name }}</h1>
        <h1 class="text-heading" v-else>Welcome Back!</h1>
        <a-form>
          <a-text-field
            label="E-Mail"
            type="text"
            class="form-control"
            v-model="entity.email"
            @update:model-value="entity.email = $event.toLowerCase()"
            color="focus" />
          <div v-if="!usePassword" class="font-italic text-body-2 mb-4">
            We'll send you an email to sign you in - no password needed! <b>Click send</b> then <b>check your email</b>.
          </div>
          <a-text-field
            v-if="usePassword"
            label="Password"
            :type="passwordInputType"
            class="form-control"
            v-model="entity.password"
            :append-inner-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
            @click:appendInner="showPasswords = !showPasswords"
            color="focus" />
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
                @click.stop="$emit('updateActive', 'forgot-password')"
                class="white-space-nowrap font-weight-medium mr-4"
                role="button"
                >Forgot password?</a
              >
            </template>
            <a-btn type="submit" @click.prevent="handleSubmitClick" color="primary" :loading="isSubmitting">{{
              usePassword ? 'Login' : 'Send Link'
            }}</a-btn>
          </div>
        </a-form>
        <div class="text-center text-muted mt-5">
          <a-btn variant="text" small color="primary" @click="switchSignInMode" data-testid="toggle-method">
            {{ usePassword ? 'email me a sign in link instead' : 'sign in with password instead' }}
          </a-btn>
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
          <a-btn v-if="useLink" :to="registerLink" color="primary" class="px-8" role="link"> Register now </a-btn>
          <a-btn v-else @click.stop="$emit('updateActive', 'register')" color="primary" class="px-8" role="button">
            Register now
          </a-btn>
        </div>
      </template>
    </div>

    <div class="align-self-end">
      <a-btn v-if="skippable" @click.stop="$emit('skip')" color="primary" class="no-uppercase" variant="text">
        or skip
      </a-btn>
    </div>

    <a-alert v-if="status" class="mt-4" mode="fade" variant="text" type="error">{{ status }}</a-alert>
  </a-card>
  <a-alert
    v-else
    icon="mdi-email-fast"
    prominent
    border-color="success"
    color="success"
    border="start"
    elevation="2"
    class="card-width mb-0">
    <h1>Magic link sent!</h1>
    <p class="body-1 my-6">
      Follow the link we sent you at <span class="font-weight-medium">{{ entity.email }}</span> to finish logging in!
    </p>
    <div class="text-right text-muted mt-5">
      <a-btn variant="text" small @click="signInLinkSent = false"> Back to login </a-btn>
    </div>
  </a-alert>
</template>

<script>
import api from '@/services/api.service';
import { get } from 'lodash';
import { autoJoinWhiteLabelGroup, redirectAfterLogin } from '@/utils/memberships';

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
    skippable: {
      type: Boolean,
      default: false,
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
        query: {
          initialEmail: this.entity.email,
          initialPassword: this.entity.password,
        },
      };
      if (this.$route.query?.redirect) {
        link.query.redirect = this.$route.query?.redirect;
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
    switchSignInMode() {
      this.usePassword = !this.usePassword;
      this.status = null;
    },
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
        const landingPath = this.$route.query.redirect || this.$route.query.landingPath;
        const callbackUrl = this.$route.query.callbackUrl;

        try {
          await this.$store.dispatch('auth/sendMagicLink', { email: this.entity.email, landingPath, callbackUrl });
          this.signInLinkSent = true;
          this.status = '';
        } catch (e) {
          this.status = get(e, 'response.data.message') || 'An error occurred, please try again later.';
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

        //make sure whitelabel user is a member of its whitelabel group (this reflects legacy behaviour, though it's not clear why this had been added in the past)
        const partnerGroupId = await autoJoinWhiteLabelGroup(this.$store);
        //change route
        await redirectAfterLogin(this.$store, this.$router, this.$route.query.redirect, partnerGroupId);
      } catch (error) {
        switch (error.response?.status) {
          case 401:
            this.status = 'Invalid email or password'; //error.response.data.message;
            break;
          case 404:
            this.status = 'Invalid email or password'; //error.response.data.message;
            break;
          default:
            this.status = 'An error occurred'; //'Unknown error :/';
        }
        return;
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

<style scoped lang="scss">
a {
  text-decoration: none;
}

.line {
  border-top: 2px solid rgb(180, 180, 180);
  width: 40%;
  margin-top: -1px;
}
.card-width {
  max-width: min(700px, 92vw);
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
.no-uppercase {
  text-transform: unset !important;
}
</style>
