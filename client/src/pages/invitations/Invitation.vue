<template>
  <a-container>
    <a-card color="background">
      <a-alert v-if="errorMsg" class="mt-4" mode="fade" variant="text" type="error">{{ errorMsg }} </a-alert>
      <template v-if="initialized && membership">
        <a-card-title class="text-heading d-flex pa-4"> Invitation</a-card-title>
        <a-card-subtitle> Code {{ code }}</a-card-subtitle>
        <a-card-text>
          <div v-if="membership.meta.status === 'pending'">
            <a-alert class="mt-4" variant="outlined" v-if="membership" type="info"
              >This code allows you to join <strong>{{ membership.group.name }}</strong
              >!
            </a-alert>
          </div>
          <div v-else>
            <a-alert class="mt-4" variant="outlined" v-if="membership" type="error"
              >This code has already been activated and is no longer valid...
            </a-alert>
          </div>
        </a-card-text>
        <a-card-actions v-if="membership.meta.status === 'pending'" class="d-flex justify-end">
          <a-btn variant="text" @click="cancel">Cancel</a-btn>
          <a-btn color="primary" variant="flat" @click="join">Join {{ membership.group.name }}</a-btn>
        </a-card-actions>
      </template>
      <template v-else-if="initialized && !membership">
        <a-card-text>
          <a-text-field v-model="code" label="Invitation" />
          <a-card-actions>
            <a-btn class="primary" @click="fetchData">Try code</a-btn>
          </a-card-actions>
        </a-card-text>
      </template>
      <a-progress-circular v-else :size="50" />
    </a-card>
  </a-container>
</template>

<script>
import api from '@/services/api.service';
import { get } from 'lodash';
import ACardTitle from '@/components/ui/elements/ACardTitle.vue';
import ACardSubtitle from '@/components/ui/elements/ACardSubtitle.vue';
import ACardText from '@/components/ui/elements/ACardText.vue';
import ACardActions from '@/components/ui/elements/ACardActions.vue';

import { reloadPage } from '@/utils/memberships';

export default {
  components: { ACardActions, ACardText, ACardSubtitle, ACardTitle },
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
        this.errorMsg = get(error, 'response.data.message') || 'An error occurred, please try again later.';
        return;
      }

      this.$router.push(`/groups/${this.membership.group._id}`).then(reloadPage);
    },
  },

  async created() {
    const { code } = this.$route.query;
    this.code = code;
    await this.fetchData();
  },
};
</script>
