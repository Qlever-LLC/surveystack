<template>
  <v-container class="maxw-40 px-0">
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

      <div
        class="text-center text-muted mt-5"
        v-if="registrationEnabled"
      >
        Don't have an account?
        <router-link :to="registerLink">Register now</router-link>
      </div>
    </v-card>

    <v-alert
      class="mt-4"
      outlined
      v-if="membership"
      type="info"
    >Your code is eligible to join <strong>{{membership.group.name}}</strong></v-alert>

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
import api from '@/services/api.service';
import { autoSelectActiveGroup } from '@/utils/memberships';


const DEFAULT_ENTITY = {
  email: '',
  password: '',
};

export default {
  components: {
    appFeedback,
  },
  props: {
    initialEmail: {
      type: String,
      required: false,
    },
  },
  data() {
    return {
      status: '',
      showPasswords: false,
      entity: {
        ...DEFAULT_ENTITY,
      },
      invitation: '',
      membership: null,
      registrationEnabled: false,
    };
  },
  computed: {
    passwordInputType() {
      return this.showPasswords ? 'text' : 'password';
    },
    registerLink() {
      const link = {
        name: 'auth-register',
        params: {
          initialEmail: this.entity.email,
          initialPassword: this.entity.password,
        },
      };

      if (this.$route.params && this.$route.params.redirect) {
        link.params.redirect = this.$route.params.redirect;
      }

      if (this.invitation) {
        link.query = { invitation: this.invitation };
      }
      return link;
    },
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
    },
    whitelabelPartner() {
      return this.$store.getters['whitelabel/partner'];
    },
  },
  async created() {
    if (this.initialEmail) {
      this.entity.email = this.initialEmail;
    }

    const { invitation } = this.$route.query;
    this.invitation = invitation;
    if (invitation) {
      this.$store.dispatch('invitation/set', invitation);
      const { data: [membership] } = await api.get(`/memberships?invitationCode=${invitation}&populate=true`);
      this.membership = membership;
    }

    console.log('created', this.isWhitelabel);

    if (this.isWhitelabel) {
      const { data } = await api.get(`/groups/${this.whitelabelPartner.id}`);
      if (!data.meta.invitationOnly) {
        this.registrationEnabled = true;
      }
    } else {
      this.registrationEnabled = true;
    }

    // magic link login
    const {
      cfs, email, token, group,
    } = this.$route.query;
    if (cfs) {
      await this.$store.dispatch('auth/login', {
        url: '/auth/login',
        user: { email: email.replace(/ /g, '+'), token }, // TODO: find a better solution for + signs
      });

      this.$store.dispatch('surveys/fetchPinned');
      await autoSelectActiveGroup(this.$store, group);
      this.$router.replace({ name: 'surveys-detail', params: { id: cfs } });
    }
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
        await this.$store.dispatch('auth/login', {
          url: '/auth/login',
          user: this.entity,
        });

        await autoSelectActiveGroup(this.$store, this.isWhitelabel ? this.whitelabelPartner.id : null);

        this.$store.dispatch('surveys/fetchPinned');

        if (this.$route.params.redirect) {
          this.$router.push(this.$route.params.redirect);
        } else if (this.$store.getters['invitation/hasInvitation']) {
          this.$router.push({ name: 'invitations', query: { code: this.$store.getters['invitation/code'] } });
        } else {
          this.$router.push('/');
        }
      } catch (error) {
        console.log('error', error);
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
