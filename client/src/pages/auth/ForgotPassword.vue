<template>
  <div class="wrapper">
    <v-container class="maxw-40">
      <app-forgot-password :useLink="true" />
    </v-container>
  </div>
</template>

<script>
import api from '@/services/api.service';

import AppForgotPassword from '@/components/ui/ForgotPassword.vue';

export default {
  components: {
    AppForgotPassword,
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

      if (!this.email || this.email.trim() === '') {
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

<style scoped>
.wrapper {
  height: 100%;
  background-color: var(--v-background-base);
}
</style>
