<template>
  <v-container class="mw-40">
    <v-card class="pa-5">
      <h1>Register</h1>
      <v-form class="mb-5">
        <v-text-field
          label="E-Mail"
          type="text"
          class="form-control"
          :value="entity.email.toLowerCase()"
          @input="entity.email = $event.toLowerCase()"
        />

        <v-text-field
          label="Name"
          type="text"
          class="form-control"
          v-model="entity.name"
        />

        <v-text-field
          label="Password"
          :type="passwordInputType"
          class="form-control"
          v-model="entity.password"
          :append-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append="showPasswords = !showPasswords"
        />

        <v-text-field
          label="Password confirmation"
          :type="passwordInputType"
          class="form-control"
          v-model="passwordConfirmation"
          :append-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append="showPasswords = !showPasswords"
        />

        <div class="d-flex justify-end">
          <v-btn
            type="button"
            class="mr-2"
            text
            @click="reset"
          >Reset</v-btn>
          <v-btn
            type="submit"
            @click.prevent="submit"
            color="primary"
          >Sign up</v-btn>
        </div>
      </v-form>
      <div class="text-center text-muted mt-5">
        Already have an account?
        <router-link to="/auth/login">Sign in</router-link>
      </div>

    </v-card>
    <transition name="fade">
      <app-feedback
        v-if="status"
        class="mt-5"
        @closed="status = ''"
      >{{status}}</app-feedback>
    </transition>
  </v-container>
</template>

<script>
import appFeedback from '@/components/ui/Feedback.vue';

const DEFAULT_ENTITY = {
  email: '',
  name: '',
  password: '',
};

export default {
  components: {
    appFeedback,
  },
  data() {
    return {
      status: '',
      passwordConfirmation: '',
      showPasswords: false,
      entity: { ...DEFAULT_ENTITY },
    };
  },
  props: {
    initialEmail: {
      type: String,
      required: false,
    },
  },
  created() {
    if (this.initialEmail) {
      this.entity.email = this.initialEmail;
    }
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
      this.status = '';
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
        const user = await this.$store.dispatch('auth/login', {
          url: '/auth/register',
          user: this.entity,
        });
        const memberships = await this.$store.dispatch('memberships/getUserMemberships', user._id);
        console.log(user, memberships);
        this.$router.push('/surveys');
      } catch (error) {
        console.log(error.response);
        switch (error.response.status) {
          case 409:
            this.status = error.response.data.message;
            break;
          default:
            this.status = 'Unknown error :/';
        }
      }
    },
    reset() {
      this.entity = { ...DEFAULT_ENTITY };
    },
  },
};
</script>

<style scoped>
a {
  text-decoration: none;
}
</style>
