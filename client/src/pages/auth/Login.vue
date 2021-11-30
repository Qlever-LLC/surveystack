<template>
  <div class="wrapper">
    <v-container v-if="!signInLinkSent" class="maxw-40 px-0" :class="{ 'pt-2': showHero }">
      <div v-if="showHero">
        <v-img
          v-if="isWhitelabel"
          :src="$store.getters['whitelabel/partner'].hero || $store.getters['whitelabel/partner'].logo"
          class="my-3 mx-2"
          contain
          height="128"
        />
        <v-img v-else :src="require('../../assets/surveystack_temp_logo.svg')" class="my-3 mx-2" contain height="128" />
      </div>
      <v-card class="pa-5 login-card">
        <v-alert v-if="!usePassword && 'magicLinkExpired' in $route.query" dense type="error">
          Your magic link is expired. Please request a new one!
        </v-alert>
        <h1 class="heading--text text-center" v-if="isWhitelabel && registrationEnabled">
          Login &amp; Join {{ whitelabelPartner.name }}
        </h1>
        <h1 class="heading--text" v-else>Login</h1>

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
          <small v-if="usePassword">
            <router-link
              :to="{
                name: 'auth-forgot-password',
                query: { email: entity.email },
              }"
              >Forgot password?</router-link
            >
          </small>
          <div class="d-flex justify-end">
            <v-btn type="button" class="mr-2" text @click="reset">Reset</v-btn>
            <v-btn type="submit" @click.prevent="handleSubmitClick" color="primary" :loading="isSubmitting">{{
              usePassword ? 'Login' : 'Email me sign in link'
            }}</v-btn>
          </div>
        </v-form>

        <div class="text-center text-muted mt-5" v-if="registrationEnabled || hasInvitation">
          <v-btn text small color="primary" @click="usePassword = !usePassword">
            {{ usePassword ? 'sign in with email instead' : 'sign in with password instead' }}
          </v-btn>
        </div>
      </v-card>

      <v-alert class="mt-4" outlined v-if="membership" type="info"
        >Your code is eligible to join <strong>{{ membership.group.name }}</strong></v-alert
      >

      <transition name="fade">
        <app-feedback v-if="status" class="mt-5" @closed="status = ''">{{ status }}</app-feedback>
      </transition>
    </v-container>

    <!-- TODO move this into another component -->
    <v-container v-else class="maxw-40 px-0" :class="{ 'pt-2': showHero }">
      <v-card class="pa-5 login-card">
        <h1 class="heading--text text-center" v-if="isWhitelabel && registrationEnabled">
          Login &amp; Join {{ whitelabelPartner.name }}
        </h1>
        <h1 class="heading--text" v-else>Magic link sent!</h1>
        <p class="body-1 my-6">
          Follow the link we sent you at <span class="font-weight-medium">{{ entity.email }}</span> to finish logging
          in!
        </p>
        <div class="text-center text-muted mt-5">
          <v-btn text small @click="signInLinkSent = false">
            Back to login
          </v-btn>
        </div>
      </v-card>
    </v-container>
  </div>
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
    showHero: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      status: '',
      usePassword: false,
      signInLinkSent: false,
      isSubmitting: false,
      showPasswords: false,
      entity: {
        ...DEFAULT_ENTITY,
      },
      invitation: '',
      membership: null,
      registrationEnabled: false,
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

    // TODO remove invitation related code
    const { invitation } = this.$route.query;
    this.invitation = invitation;
    if (invitation) {
      this.$store.dispatch('invitation/set', invitation);
      const {
        data: [membership],
      } = await api.get(`/memberships?invitationCode=${invitation}&populate=true`);
      this.membership = membership;
    }

    console.log('created', this.isWhitelabel);

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

      if (!this.usePassword) {
        const returnUrl = this.$route.params.redirect || this.$route.query.returnUrl;
        await this.$store.dispatch('auth/sendMagicLink', { email: this.entity.email, returnUrl });
        this.signInLinkSent = true;
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

        // try to auto join group if this is a whitelabel
        if (this.isWhitelabel && this.registrationEnabled) {
          console.log('trying autojoin');

          try {
            const { data } = await api.post(`/memberships/join-group?id=${this.whitelabelPartner.id}`);
            console.log('data', data);
            await autoSelectActiveGroup(this.$store, this.whitelabelPartner.id);
          } catch (error) {
            console.log(error.response.data.message);
          }
        } else {
          // auto select the first group of the user
          await autoSelectActiveGroup(this.$store, null, true);
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
      } catch (error) {
        console.log('error', error);
        switch (error.response.status) {
          case 401:
            this.status = error.response.data.message;
            break;
          case 404:
            this.status = error.response.data.message;
            break;
          default:
            this.status = 'Unknown error :/';
        }
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

.wrapper {
  background-color: var(--v-background-base);
  height: 100%;
}
</style>
