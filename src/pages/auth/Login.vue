<template>
  <v-container class="mw-40">
    <v-card class="pa-5">
      <h1>Login</h1>
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
          :append-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append="showPasswords = !showPasswords"
        />
        <small>
          <router-link :to="{name: 'auth-forgot-password', query: {email: entity.email}}">Forgot password?</router-link>
        </small>
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
          >Login</v-btn>
        </div>
      </v-form>

      <div class="text-center text-muted mt-5">
        Don't have an account?
        <router-link :to="{name: 'auth-register', params: {initialEmail: entity.email, initialPassword: entity.password}}">Register now</router-link>
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
  password: '',
};

export default {
  components: {
    appFeedback,
  },
  data() {
    return {
      status: '',
      showPasswords: false,
      entity: {
        ...DEFAULT_ENTITY,
      },
    };
  },
  props: {
    initialEmail: {
      type: String,
      required: false,
    },
  },
  computed: {
    passwordInputType() {
      return this.showPasswords ? 'text' : 'password';
    },
  },
  created() {
    if (this.initialEmail) {
      this.entity.email = this.initialEmail;
    }
    console.log(this.$route.params);
  },
  methods: {
    async submit() {
      if (this.entity.email === '') {
        this.status = 'E-Mail must not be empty.';
        return;
      }

      if (this.entity.password === '') {
        this.status = 'Password must not be empty.';
        return;
      }

      try {
        const user = await this.$store.dispatch('auth/login', {
          url: '/auth/login',
          user: this.entity,
        });
        const memberships = await this.$store.dispatch('memberships/getUserMemberships', user._id);
        if (
          // !this.$store.getters['memberships/activeGroup'] &&
          memberships
          && memberships.length > 0
          && memberships[0].group
        ) {
          this.$store.dispatch('memberships/setActiveGroup', memberships[0].group._id);
        }
        if (this.$route.params.redirect) {
          this.$router.push(this.$route.params.redirect);
        } else {
          this.$router.push('/');
        }
      } catch (error) {
        switch (error.response.status) {
          case 401:
            this.status = error.response.data.message;
            break;
          case 404:
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
