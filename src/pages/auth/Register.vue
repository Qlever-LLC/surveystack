<template>
  <v-container class="maxw-40">
    <v-card class="pa-5">
      <h1 v-if="isWhitelabel">Register to join {{ whitelabelPartner.name }}</h1>
      <h1 v-else>Register</h1>
      <v-form class="mb-5">
        <v-text-field
          label="E-Mail"
          type="text"
          class="form-control"
          :value="entity.email.toLowerCase()"
          @input="entity.email = $event.toLowerCase()"
        />

        <v-text-field label="Name" type="text" class="form-control" v-model="entity.name" />

        <v-text-field
          label="Password"
          :type="passwordInputType"
          class="form-control"
          v-model="entity.password"
          :append-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append="showPasswords = !showPasswords"
        />

        <v-text-field
          label="Password confirmation"
          :type="passwordInputType"
          class="form-control"
          v-model="passwordConfirmation"
          :append-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append="showPasswords = !showPasswords"
        />

        <div class="d-flex justify-end">
          <v-btn type="button" class="mr-2" text @click="reset">Reset</v-btn>
          <v-btn type="submit" @click.prevent="submit" color="primary">Sign up</v-btn>
        </div>
      </v-form>
      <div class="text-center text-muted mt-5">
        Already have an account?
        <router-link :to="signInLink">Sign in</router-link>
      </div>
    </v-card>

    <v-alert class="mt-4" outlined v-if="membership" type="info"
      >Your code is eligible to join <strong>{{ membership.group.name }}</strong></v-alert
    >

    <transition name="fade">
      <app-feedback v-if="status" class="mt-5" @closed="status = ''">{{ status }}</app-feedback>
    </transition>
  </v-container>
</template>

<script>
import appFeedback from '@/components/ui/Feedback.vue';
import api from '@/services/api.service';

import { autoSelectActiveGroup } from '@/utils/memberships';

const DEFAULT_ENTITY = {
  email: '',
  name: '',
  password: '',
};

export default {
  components: {
    appFeedback,
  },
  data() {
    return {
      status: '',
      passwordConfirmation: '',
      showPasswords: false,
      entity: { ...DEFAULT_ENTITY },
      invitation: '',
      membership: null,
    };
  },
  props: {
    initialEmail: {
      type: String,
      required: false,
    },
  },
  computed: {
    passwordInputType() {
      return this.showPasswords ? 'text' : 'password';
    },
    passwordShowHideText() {
      return this.showPasswords ? 'Hide passwords' : 'Show passwords';
    },
    signInLink() {
      const link = { name: 'auth-login', params: {} };

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
  methods: {
    async submit() {
      this.status = '';
      console.log('submitting');

      if (this.entity.email === '') {
        this.status = 'Email must not be empty.';
        return;
      }

      if (this.entity.password === '') {
        this.status = 'Password must not be empty.';
        return;
      }

      if (this.entity.password !== this.passwordConfirmation) {
        this.status = 'Passwords do not match.';
        return;
      }

      try {
        const user = await this.$store.dispatch('auth/login', {
          url: '/auth/register',
          user: this.entity,
        });

        // try to auto join group if this is a whitelabel
        if (this.isWhitelabel) {
          try {
            const { data } = await api.post(`/memberships/join-group?id=${this.whitelabelPartner.id}`);
            await autoSelectActiveGroup(this.$store, this.whitelabelPartner.id);
          } catch (error) {
            console.log(error.response.data.message);
          }
        }

        if (this.$route.params.redirect) {
          this.$router.push(this.$route.params.redirect);
        } else if (this.hasInvitation) {
          this.$router.push({
            name: 'invitations',
            query: { code: this.$store.getters['invitation/code'] },
          });
        } else {
          this.$store.dispatch('surveys/fetchPinned');
          this.$router.push('/');
        }
      } catch (error) {
        console.log(error.response);
        switch (error.response.status) {
          case 409:
            this.status = error.response.data.message;
            break;
          case 400:
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
  },
};
</script>

<style scoped>
a {
  text-decoration: none;
}
</style>
