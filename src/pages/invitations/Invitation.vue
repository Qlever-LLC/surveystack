<template>
  <v-container v-if="initialized && membership">
    <h1>Invitation</h1>
    <p class="subtitle-2 text--secondary">{{code}}</p>
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

export default {
  data() {
    return {
      initialized: false,
      code: null,
      membership: null,
    };
  },
  methods: {
    async fetchData() {
      this.initialized = false;
      if (this.code) {
        const { data: [membership] } = await api.get(`/memberships?invitation=${this.code}&populate=true`);
        this.membership = membership;
      }

      this.initialized = true;
    },
    cancel() {
      this.$store.dispatch('invitation/clear');
      this.$router.push('/');
    },
    join() {
      this.$store.dispatch('invitation/clear');
      // TODO: call membership claim endpoint
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
