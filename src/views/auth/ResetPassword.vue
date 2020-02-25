<template>
  <v-container>
    <v-form @submit.prevent="submit">
      <v-text-field v-model="newPassword" />
      <v-text-field v-model="newPasswordConfirmation" />
      <v-btn type="submit">Change my password</v-btn>
    </v-form>
  </v-container>
</template>


<script>
import axios from 'axios';

export default {
  data() {
    return {
      email: '',
      token: '',
      newPassword: '',
      newPasswordConfirmation: '',
    };
  },
  submit() {
    console.log('weeee');
  },
};
</script>
