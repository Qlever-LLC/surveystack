<template>
  <div class="container-mid">
    <h3>Login</h3>
    <v-form>
      <v-text-field
        label="Username"
        type="text"
        class="form-control"
        :value="user.username"
        @input="user.username = $event.toLowerCase()"
      />
      <v-text-field
        label="Password"
        :type="passwordInputType"
        class="form-control"
        v-model="user.password"
      />
      <div class="d-flex">
        <v-btn
          type="button"
          class="btn btn-outline-secondary mr-auto"
          @click="showPasswords = !showPasswords"
        >{{passwordShowHideText}}</v-btn>
        <v-btn class="btn btn-primary" type="submit" @click.prevent="submit" color="primary">Submit</v-btn>
      </div>
    </v-form>

    <app-feedback v-if="status" class="mt-5" @closed="status = ''">{{status}}</app-feedback>

    <div class="text-center text-muted mt-5">
      Don't have an account?
      <router-link :to="{name: 'auth-register'}">Register now</router-link>.
    </div>
  </div>
</template>


<script>
import appFeedback from '@/components/ui/Feedback.vue';

export default {
  components: {
    appFeedback,
  },
  data() {
    return {
      status: '',
      showPasswords: false,
      user: {
        username: '',
        password: '',
      },
    };
  },
  computed: {
    passwordInputType() {
      return this.showPasswords ? 'text' : 'password';
    },
    passwordShowHideText() {
      return this.showPasswords ? 'Hide password' : 'Show password';
    },
  },
  methods: {
    changedUsername(ev) {
      console.log(ev);
    },
    async submit() {
      console.log('submitting');

      if (this.user.username === '') {
        this.status = 'Username must not be empty.';
        return;
      }

      if (this.user.password === '') {
        this.status = 'Password must not be empty.';
        return;
      }

      try {
        await this.$store.dispatch('auth/login', {
          url: '/auth/login',
          user: this.user,
        });
        this.$router.push('/');
      } catch (error) {
        switch (error.response.status) {
          case 401:
            this.status = error.response.data;
            break;
          case 404:
            this.status = error.response.data;
            break;
          default:
            this.status = 'Unknown error :/';
        }
      }
    },
  },
};
</script>
