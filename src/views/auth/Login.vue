<template>
  <div class="container-mid">
    <h3>Login</h3>
    <p>Default admin: admin@our-sci.net // 1234</p>
    <v-form>
      <v-text-field
        label="E-Mail"
        type="text"
        class="form-control"
        :value="entity.email"
        @input="entity.email = $event.toLowerCase()"
      />
      <v-text-field
        label="Password"
        :type="passwordInputType"
        class="form-control"
        v-model="entity.password"
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
      entity: {
        email: '',
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
    async submit() {
      console.log('submitting');

      if (this.entity.email === '') {
        this.status = 'E-Mail must not be empty.';
        return;
      }

      if (this.entity.password === '') {
        this.status = 'Password must not be empty.';
        return;
      }

      try {
        await this.$store.dispatch('auth/login', {
          url: '/auth/login',
          user: this.entity,
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
