<template>
  <div class="container-mid">
    <h3>Register</h3>
    <v-form class="mb-5">
      <v-text-field
        label="Username"
        type="text"
        class="form-control"
        :value="user.username.toLowerCase()"
        @input="user.username = $event.toLowerCase()"
      />

      <v-text-field
        label="Email"
        type="text"
        class="form-control"
        :value="user.email.toLowerCase()"
        @input="user.email = $event.toLowerCase()"
      />

      <v-text-field
        label="Password"
        :type="passwordInputType"
        class="form-control"
        v-model="user.password"
      />

      <v-text-field
        label="Password confirmation"
        :type="passwordInputType"
        class="form-control"
        v-model="passwordConfirmation"
      />

      <div class="d-flex">
        <v-btn
          type="button"
          class="mr-auto"
          @click="showPasswords = !showPasswords"
        >{{passwordShowHideText}}</v-btn>
        <v-btn type="button" class="mr-2" outlined>Cancel</v-btn>
        <v-btn type="submit" @click.prevent="submit" color="primary">Sign up</v-btn>
      </div>
    </v-form>
    <app-feedback v-if="status" @closed="status = ''">{{status}}</app-feedback>
    <app-username-rules v-if="showUsernameRules" class="mt-2" @closed="showUsernameRules = false" />
    <div class="text-center text-muted mt-5">
      Already have an account?
      <router-link to="/auth/login">Go to login</router-link>.
    </div>
  </div>
</template>

<script>
import { isValidUsername } from '@/utils/index';
import appUsernameRules from '@/components/auth/UsernameRules.vue';

export default {
  data() {
    return {
      status: '',
      passwordConfirmation: '',
      showPasswords: false,
      showUsernameRules: false,
      user: {
        username: '',
        password: '',
        email: '',
      },
    };
  },
  computed: {
    passwordInputType() {
      return this.showPasswords ? 'text' : 'password';
    },
    passwordShowHideText() {
      return this.showPasswords ? 'Hide passwords' : 'Show passwords';
    },
    mode() {
      return this.$route.name === 'auth-register' ? 'register' : 'login';
    },
  },
  methods: {
    async submit() {
      console.log('submitting');

      if (this.user.username === '') {
        this.status = 'Username must not be empty.';
        return;
      }

      if (!isValidUsername(this.user.username)) {
        this.status = 'Invalid username';
        this.showUsernameRules = true;
        return;
      }

      if (this.user.password === '') {
        this.status = 'Password must not be empty.';
        return;
      }

      if (this.user.password !== this.passwordConfirmation) {
        this.status = 'Passwords do not match.';
        return;
      }

      try {
        // await api.post("/auth/register", this.user);
        await this.$store.dispatch('auth/login', {
          url: '/auth/register',
          user: this.user,
        });
        this.$router.push('/surveys');
      } catch (error) {
        switch (error.response.status) {
          case 409:
            this.status = error.response.data;
            break;
          default:
            this.status = 'Unknown error :/';
        }
      }
    },
  },
  components: {
    appUsernameRules,
  },
};
</script>
