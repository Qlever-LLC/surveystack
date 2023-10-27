<template>
  <v-container>
    <v-card class="pa-6 pa-sm-12">
      <h1>Forgot Password?</h1>
      <p>Enter your email address and we will send you a link for setting a new password.</p>

      <v-form @submit.prevent="submit">
        <v-text-field v-model="email" label="Email" />
        <div class="d-flex justify-end">
          <v-btn type="submit" color="primary" class="px-8">Submit</v-btn>
        </div>
      </v-form>
      <div class="text-center text-muted mt-5">
        <router-link v-if="useLink" :to="signInLink" class="font-weight-medium" role="link">Back to login</router-link>
        <a v-else text @click.stop="$emit('updateActive', 'login')" class="font-weight-medium" role="button"
          >Back to login</a
        >
      </div>
      <a-alert v-if="status.type" class="mt-4 mb-0" mode="fade" text :type="status.type">{{ status.message }}</a-alert>
    </v-card>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import AAlert from '@/components/ui/AAlert.vue';

export default {
  components: { AAlert },
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

      if (!this.email || this.email.trim() === '') {
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
          message:
            'If your email address exists in our database, you will receive a password recovery link at your email address in a few minutes.',
        };
      } catch (error) {
        this.status = {
          type: 'error',
          message: 'An error occurred, please try again later.',
        };
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
