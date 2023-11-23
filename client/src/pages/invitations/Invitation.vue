<template>
  <v-container>
    <a-alert v-if="errorMsg" class="mt-4" mode="fade" text type="error">{{ errorMsg }}</a-alert>
    <template v-if="initialized && membership">
      <h1>Invitation</h1>
      <p class="subtitle-2 text--secondary">{{ code }}</p>
      <div v-if="membership.meta.status === 'pending'">
        <a-alert class="mt-4" outlined v-if="membership" type="info"
          >This code allows you to join <strong>{{ membership.group.name }}</strong
          >!
        </a-alert>

        <div class="d-flex justify-end">
          <a-btn text @click="cancel">Cancel</a-btn>
          <a-btn color="primary" @click="join">Join {{ membership.group.name }}</a-btn>
        </div>
      </div>
      <div v-else>
        <a-alert class="mt-4" outlined v-if="membership" type="error"
          >This code has already been activated and is no longer valid...
        </a-alert>
      </div>
    </template>
    <template v-else-if="initialized && !membership">
      <a-text-field v-model="code" label="Invitation" />
      <div class="d-flex justify-end">
        <a-btn class="primary" @click="fetchData">Try code</a-btn>
      </div>
    </template>
    <v-progress-circular v-else :size="50" color="primary" indeterminate></v-progress-circular>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import { autoSelectActiveGroup } from '@/utils/memberships';
import { get } from 'lodash';
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
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
        this.errorMsg = membership
          ? null
          : "We couldn't find an invitation matching this code. Your invitation may have expired.";
      }

      this.initialized = true;
    },
    cancel() {
      this.$router.push('/');
    },
    async join() {
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
