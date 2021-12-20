<template>
  <v-container>
    <v-alert v-if="errorMsg" class="mt-4" mode="fade" text type="error">{{ errorMsg }}</v-alert>
    <template v-if="initialized && membership">
      <h1>Invitation</h1>
      <p class="subtitle-2 text--secondary">{{ code }}</p>
      <div v-if="membership.meta.status === 'pending'">
        <v-alert class="mt-4" outlined v-if="membership" type="info"
          >This code allows you to join <strong>{{ membership.group.name }}</strong
          >!
        </v-alert>

        <div class="d-flex justify-end">
          <v-btn text @click="cancel">Cancel</v-btn>
          <v-btn color="primary" @click="join">Join {{ membership.group.name }}</v-btn>
        </div>
      </div>
      <div v-else>
        <v-alert class="mt-4" outlined v-if="membership" type="error"
          >This code has already been activated and is no longer valid...
        </v-alert>
      </div>
    </template>
    <template v-else-if="initialized && !membership">
      <v-text-field v-model="code" label="Invitation"></v-text-field>
      <div class="d-flex justify-end">
        <v-btn class="primary" @click="fetchData">Try code</v-btn>
      </div>
    </template>
    <v-progress-circular v-else :size="50" color="primary" indeterminate></v-progress-circular>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import { autoSelectActiveGroup } from '@/utils/memberships';
import { get } from 'lodash';

export default {
  data() {
    return {
      initialized: false,
      code: null,
      membership: null,
      errorMsg: null,
    };
  },
  methods: {
    async fetchData() {
      this.initialized = false;
      if (this.code) {
        const {
          data: [membership],
        } = await api.get(`/memberships?invitationCode=${this.code}&populate=true`);
        this.membership = membership;
        this.errorMsg = membership ? null : "We didn't find any invitation with this code";
      }

      this.initialized = true;
    },
    cancel() {
      this.$store.dispatch('invitation/clear'); // DEPRECATED:, remove a few weeks after https://gitlab.com/our-sci/software/surveystack/-/merge_requests/67  was deployed
      this.$router.push('/');
    },
    async join() {
      this.$store.dispatch('invitation/clear'); // DEPRECATED:, remove a few weeks after https://gitlab.com/our-sci/software/surveystack/-/merge_requests/67  was deployed

      try {
        const { data } = await api.post('/memberships/activate', { code: this.code });
        // Log in with the user linked to the membership
        // The endpoint returns a login payload when the user is not logged in, or logged in with a different user
        if (data.token) {
          await this.$store.dispatch('auth/loginWithUserObject', data);
        }
      } catch (error) {
        this.errorMsg = get(error, 'response.data.message') || 'An error occured, please try again later.';
        return;
      }

      // Set joined group as active group
      // autoSelectActiveGroup also fetches the user's groups, so we are using this instead of
      // just dispatching 'memberships/setActiveGroup'
      await autoSelectActiveGroup(this.$store, this.membership.group._id);

      this.$store.dispatch('surveys/fetchPinned');
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
