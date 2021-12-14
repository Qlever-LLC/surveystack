<template>
  <v-container>
    <v-card class="pa-6 pa-sm-12">
      <h1>Forgot Password</h1>
      <p>Enter your email address and we will send you a link for setting a new password.</p>

      <v-form @submit.prevent="submit">
        <v-text-field v-model="email" label="Email" />
        <div class="d-flex justify-end">
          <v-btn type="submit" color="primary" class="text-capitalize px-8">Submit</v-btn>
        </div>
      </v-form>
      <div class="text-center text-muted mt-5">
        <router-link v-if="useLink" :to="signInLink" class="font-weight-medium" role="link"
          >Back to Sign in</router-link
        >
        <a v-else text @click.stop="$emit('updateActive', 'login')" class="font-weight-medium" role="button"
          >Back to Sign in</a
        >
      </div>
      <transition name="fade">
        <app-feedback
          :elevation="0"
          color="red lighten-4"
          v-if="status.type === 'error'"
          class="mt-5"
          @closed="status = null"
          :type="status.type"
        >
          {{ status.message }}
        </app-feedback>
        <app-feedback
          :elevation="0"
          color="green lighten-1"
          v-if="status.type === 'success'"
          class="mt-5"
          @closed="status = null"
          :type="status.type"
        >
          {{ status.message }}
        </app-feedback>
      </transition>
    </v-card>
  </v-container>
</template>

<script>
import api from '@/services/api.service';

import appFeedback from '@/components/ui/Feedback.vue';

export default {
  components: {
    appFeedback,
  },
  data() {
    return {
      status: { type: '' },
      email: '',
    };
  },
  props: {
    useLink: {
      type: Boolean,
      default: true,
    },
  },
  created() {
    const { email } = this.$route.query;
    this.email = email;
  },
  computed: {
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
  },
  methods: {
    async submit() {
      this.status = { type: '' };

      if (this.email.trim() === '') {
        this.status = {
          type: 'error',
          message: 'Please enter a valid email address',
        };
        return;
      }
      try {
        await api.post('/auth/send-password-reset-mail', { email: this.email });
        this.status = {
          type: 'success',
          message: `Check your inbox on ${this.email}`,
        };
      } catch (error) {
        switch (error.response.status) {
          case 404:
            this.status = {
              type: 'error',
              message: 'invalid email', //error.response.data.message,
            };
            break;
          default:
            this.status = {
              type: 'error',
              message: 'Unknown error :/',
            };
        }
      }
    },
  },
};
</script>

<style scoped>
a {
  text-decoration: none;
}
</style>
