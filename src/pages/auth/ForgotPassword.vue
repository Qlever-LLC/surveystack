<template>
  <v-container class="maxw-40">
    <v-card class="pa-5">
      <h1>Password forgotten</h1>
      <p>Enter your email address and we will send you a link for setting a new password.</p>

      <v-form @submit.prevent="submit">
        <v-text-field
          v-model="email"
          label="Email"
        />
        <div class="d-flex justify-end">
          <v-btn
            type="submit"
            color="primary"
          >Submit</v-btn>
        </div>

      </v-form>
    </v-card>
    <transition name="fade">
      <app-feedback
        v-if="status"
        class="mt-5"
        @closed="status = null"
        :type="status.type"
      >{{status.message}}</app-feedback>
    </transition>
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
      status: null,
      email: '',
    };
  },
  created() {
    const { email } = this.$route.query;
    this.email = email;
  },
  methods: {
    async submit() {
      this.status = null;

      if (this.email.trim() === '') {
        this.status = {
          type: 'error',
          message: 'Please enter a valid email address',
        };
        return;
      }

      try {
        await api.post('/auth/send-password-reset-mail', { email: this.email });
        console.log('ag');
        this.status = {
          type: 'success',
          message: `Check your inbox on ${this.email}`,
        };
      } catch (error) {
        switch (error.response.status) {
          case 404:
            this.status = {
              type: 'error',
              message: error.response.data.message,
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
