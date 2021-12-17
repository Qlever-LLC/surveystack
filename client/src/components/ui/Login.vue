<template>
  <v-card v-if="!signInLinkSent" class="pa-2 pa-sm-7">
    <template>
      <div class="py-sm-5 py-6">
        <h1 class="heading--text text-center" v-if="isWhitelabel">Login &amp; Join {{ whitelabelPartner.name }}</h1>
        <h1 class="heading--text mb-4" v-else>Welcome Back</h1>
        <v-form>
          <v-text-field
            label="E-Mail"
            type="text"
            class="form-control"
            :value="entity.email"
            @input="entity.email = $event.toLowerCase()"
            color="focus"
          />
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
          <div class="colUnderW340 d-flex justify-space-around align-center">
            <template v-if="usePassword">
              <router-link
                v-if="useLink"
                :to="{
                  name: 'auth-forgot-password',
                  query: { email: entity.email },
                }"
                class="white-space-nowrap font-weight-medium ForgotPassword"
                role="link"
                >Forgot password?</router-link
              >
              <a
                v-else
                text
                @click.stop="$emit('updateActive', 'forgot-password')"
                class="white-space-nowrap font-weight-medium ForgotPassword"
                role="button"
                >Forgot password?</a
              >
            </template>
            <v-btn
              type="submit"
              @click.prevent="handleSubmitClick"
              color="primary"
              :loading="isSubmitting"
              class="text-capitalize px-8 marginb10UnderW340"
              >{{ usePassword ? 'Login' : 'Email me sign in link' }}</v-btn
            >
          </div>
        </v-form>
      </div>
      <div class="text-center text-muted mt-5">
        <v-btn text small color="primary" @click="usePassword = !usePassword" data-testid="toggle-method">
          {{ usePassword ? 'sign in with email instead' : 'sign in with password instead' }}
        </v-btn>
      </div>
    </template>

    <transition name="fade">
      <app-feedback :elevation="0" v-if="status" class="mt-5 red lighten-1" @closed="status = ''">{{
        status
      }}</app-feedback>
    </transition>
  </v-card>
  <v-alert
    v-else
    icon="mdi-email-fast"
    style="max-width: 400px"
    prominent
    colored-border
    color="success"
    border="left"
    elevation="2"
  >
    <h1>Magic link sent!</h1>
    <p class="body-1 my-6">
      Follow the link we sent you at <span class="font-weight-medium">{{ entity.email }}</span> to finish logging in!
    </p>
    <div class="text-right text-muted mt-5">
      <v-btn text small @click="signInLinkSent = false">
        Back to login
      </v-btn>
    </div>
  </v-alert>
</template>

<script>
import appFeedback from '@/components/ui/Feedback.vue';
import api from '@/services/api.service';
import { autoSelectActiveGroup } from '@/utils/memberships';

const DEFAULT_ENTITY = {
  email: '',
  password: '',
};

export default {
  components: {
    appFeedback,
  },
  props: {
    initialEmail: {
      type: String,
      required: false,
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
      invitation: '',
      membership: null,
      registrationEnabled: false,
      usePassword: false,
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

      if (this.invitation) {
        link.query = { invitation: this.invitation };
      }
      return link;
    },
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
    },
    whitelabelPartner() {
      return this.$store.getters['whitelabel/partner'];
    },
    hasInvitation() {
      return this.$store.getters['invitation/hasInvitation'];
    },
  },
  async created() {
    if (this.initialEmail) {
      this.entity.email = this.initialEmail;
    }

    const { invitation } = this.$route.query;
    this.invitation = invitation;
    if (invitation) {
      this.$store.dispatch('invitation/set', invitation);
      const {
        data: [membership],
      } = await api.get(`/memberships?invitationCode=${invitation}&populate=true`);
      this.membership = membership;
    }

    if (this.isWhitelabel) {
      const { data } = await api.get(`/groups/${this.whitelabelPartner.id}`);
      if (!data.meta.invitationOnly) {
        this.registrationEnabled = true;
      }
    } else {
      this.registrationEnabled = true;
    }

    // magic link login
    const { cfs, email, token, group } = this.$route.query;
    if (cfs) {
      await this.$store.dispatch('auth/login', {
        url: '/auth/login',
        user: { email: email.replace(/ /g, '+'), token }, // TODO: find a better solution for + signs
      });

      this.$store.dispatch('surveys/fetchPinned');
      await autoSelectActiveGroup(this.$store, group);
      this.$router.replace({ name: 'surveys-detail', params: { id: cfs } });
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
        const returnUrl = this.$route.params.redirect || this.$route.query.returnUrl;

        try {
          await this.$store.dispatch('auth/sendMagicLink', { email: this.entity.email, returnUrl });
          this.signInLinkSent = true;
        } catch (e) {
          this.status = (e.response && e.response.message) || 'An error occured, please try again later.';
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

      try {
        // try to auto join group if this is a whitelabel
        if (this.isWhitelabel && this.registrationEnabled) {
          await api.post(`/memberships/join-group?id=${this.whitelabelPartner.id}`);
          await autoSelectActiveGroup(this.$store, this.whitelabelPartner.id);
        } else {
          // auto select the first group of the user
          await autoSelectActiveGroup(this.$store, null, true);
        }
      } catch (error) {
        console.log(error.response.data.message);
      }

      this.$store.dispatch('surveys/fetchPinned');

      if (this.$route.params.redirect) {
        this.$router.push(this.$route.params.redirect);
      } else if (this.hasInvitation) {
        this.$router.push({
          name: 'invitations',
          query: { code: this.$store.getters['invitation/code'] },
        });
      } else {
        this.$router.push('/');
      }
    },
    reset() {
      this.entity = { ...DEFAULT_ENTITY };
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

.colUnderW340 {
  flex-direction: column-reverse;
}
.marginb10UnderW340 {
  margin-bottom: 10px;
}

@media (min-width: 340px) {
  /* Forgot passwd next to Login */
  .colUnderW340 {
    flex-direction: row;
  }
  .marginb10UnderW340 {
    margin: 0;
  }
  .ForgotPassword {
    margin-right: 16px;
  }
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
