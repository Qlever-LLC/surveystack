<template>
  <div class="wrapper">
    <a-container class="maxw-40">
      <a-card class="pa-5">
        <h1>New password</h1>
        <p>Set a new password for {{ this.email }}</p>
        <a-form @submit.prevent="submit">
          <a-text-field
            v-model="newPassword"
            label="Password"
            :type="passwordInputType"
            :append-inner-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="showPasswords = !showPasswords" />
          <a-text-field
            v-model="newPasswordConfirmation"
            label="Password confirmation"
            :type="passwordInputType"
            :append-inner-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="showPasswords = !showPasswords" />
          <div class="d-flex justify-end">
            <a-btn type="submit" color="primary">Set password</a-btn>
          </div>
        </a-form>
      </a-card>
      <transition name="fade">
        <app-feedback v-if="status" class="mt-5" @closed="status = {}" :type="status.type">{{
          status.message
        }}</app-feedback>
      </transition>
      <transition name="fade">
        <app-feedback v-if="showSuccessMessage" class="mt-5" :closeable="false" type="success">
          Your new password has been set!
          <router-link :to="{ name: 'auth-login', params: { initialEmail: email } }"
            >Continue to log in area</router-link
          >.
        </app-feedback>
      </transition>
    </a-container>
  </div>
</template>

<script>
import axios from 'axios';

import appFeedback from '@/components/ui/Feedback.vue';

export default {
  components: {
    appFeedback,
  },
  data() {
    return {
      email: '',
      token: '',
      status: null,
      showSuccessMessage: false,
      showPasswords: false,
      newPassword: '',
      newPasswordConfirmation: '',
    };
  },
  computed: {
    passwordInputType() {
      return this.showPasswords ? 'text' : 'password';
    },
  },
  methods: {
    async submit() {
      this.status = null;
      this.showSuccessMessage = false;

      if (this.newPassword !== this.newPasswordConfirmation) {
        this.status = {
          type: 'error',
          message: 'Passwords do not match',
        };
        return;
      }

      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/auth/reset-password`, {
          email: this.email,
          token: this.token,
          newPassword: this.newPassword,
        });
        this.showSuccessMessage = true;
      } catch (error) {
        console.log(error.response);
        this.status = {
          type: 'error',
          message: error.response.data.message,
        };
      }
    },
  },
  created() {
    const { email, token } = this.$route.query;
    this.email = email.replace(/ /g, '+'); // TODO: find a better solution for + signs in emails
    this.token = token;
  },
};
</script>

<style scoped lang="scss">
.wrapper {
  height: 100%;
  background-color: rgb(var(--v-theme-background));
}
</style>
