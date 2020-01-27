<template>
  <div class="container-mid">
    <h3>Register</h3>
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
    <div class="text-center text-muted mt-5">
      Already have an account?
      <router-link to="/auth/login">Go to login</router-link>.
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      status: '',
      passwordConfirmation: '',
      showPasswords: false,
      entity: {
        email: '',
        name: '',
        password: '',
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
        await this.$store.dispatch('auth/login', {
          url: '/auth/register',
          user: this.entity,
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
};
</script>
