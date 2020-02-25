<template>
  <v-container>
    <h1>Password forgotten</h1>
    <p>If you have forgotten your password, we can send you a link so you can set a new one.</p>

    <v-form @submit.prevent="submit">
      <v-text-field
        v-model="email"
        placeholder="Enter your email address"
        label="Email"
      />
      <v-btn type="submit">Submit</v-btn>

    </v-form>
  </v-container>
</template>

<script>
import api from '@/services/api.service';

export default {
  data() {
    return {
      email: '',
    };
  },
  created() {
    const { email } = this.$route.query;
    this.email = email;
  },
  methods: {
    async submit() {
      console.log('submitting..');
      try {
        await api.post('/auth/send-password-reset-mail', { email: this.email });
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>
