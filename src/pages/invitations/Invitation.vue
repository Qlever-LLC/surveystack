<template>
  <v-container v-if="initialized && membership">
    <h1>Invitation</h1>
    <p class="subtitle-2 text--secondary">{{code}}</p>
    <div v-if="membership.meta.status === 'pending'">
      <v-alert
        class="mt-4"
        outlined
        v-if="membership"
        type="info"
      >This code allows you to join <strong>{{membership.group.name}}</strong>!
        <div v-if="!$store.getters['auth/isLoggedIn']">Please proceed to <strong>login</strong> or <strong>create</strong> an account.</div>
      </v-alert>

      <div
        v-if="$store.getters['auth/isLoggedIn']"
        class="d-flex justify-end"
      >
        <v-btn
          text
          @click="cancel"
        >Cancel</v-btn>
        <v-btn
          color="primary"
          @click="join"
        >Join {{membership.group.name}}</v-btn>
      </div>
      <div
        v-else
        class="d-flex justify-end"
      >
        <v-btn
          text
          :to="{name: 'auth-login', query: {invitation: code}}"
        >Login</v-btn>
        <v-btn
          color="primary"
          :to="{name: 'auth-register', query: {invitation: code}}"
        >Create account</v-btn>
      </div>
    </div>
    <div v-else>
      <v-alert
        class="mt-4"
        outlined
        v-if="membership"
        type="error"
      >This code has already been activated and is no longer valid...
      </v-alert>
    </div>

  </v-container>
  <v-container v-else-if="initialized && !membership">
    <v-alert
      outlined
      type="error"
    >No valid invitation found</v-alert>
    <v-text-field
      v-model="code"
      label="Invitation"
    ></v-text-field>
    <div class="d-flex justify-end">
      <v-btn
        class="primary"
        @click="fetchData"
      >Try code</v-btn>
    </div>
  </v-container>
  <v-container v-else>
    <v-progress-circular
      :size="50"
      color="primary"
      indeterminate
    ></v-progress-circular>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import { autoSelectActiveGroup } from '@/utils/memberships';

export default {
  data() {
    return {
      initialized: false,
      code: null,
      membership: null,
    };
  },
  methods: {
    async fetchPinned() { // TODO this is copy paste!!!
      const user = this.$store.getters['auth/user'];
      this.$store.dispatch('memberships/getUserMemberships', user._id);

      const memberships = this.$store.getters['memberships/memberships'];
      // eslint-disable-next-line no-restricted-syntax
      for (const membership of memberships) {
        this.$store.dispatch('surveys/fetchPinned', membership.group._id);
      }
    },
    async fetchData() {
      this.initialized = false;
      if (this.code) {
        const { data: [membership] } = await api.get(`/memberships?invitationCode=${this.code}&populate=true`);
        this.membership = membership;
      }

      this.initialized = true;
    },
    cancel() {
      this.$store.dispatch('invitation/clear');
      this.fetchPinned();
      this.$router.push('/');
    },
    async join() {
      this.$store.dispatch('invitation/clear');
      // TODO: display status/errors
      await api.post('/memberships/activate', { code: this.code });
      await autoSelectActiveGroup(this.$store);
      this.fetchPinned();
      this.$router.push('/');
    },
  },

  async created() {
    const { code } = this.$route.query;
    this.code = code;
    await this.fetchData();
  },
};
</script>
