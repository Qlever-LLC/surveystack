<template>
  <a-dialog v-model="isVisible" width="300" @click:outside="cancel">
    <a-card>
      <a-card-title> Confirm Membership </a-card-title>
      <a-card-text>
        This will immediately activate the membership of the user "{{ membership.meta.invitationEmail }}". They will
        receive an email with login instructions. You'll be able to send "Call for Submission" links to this user.
      </a-card-text>
      <a-card-actions>
        <a-spacer />
        <a-btn variant="text" @click="cancel"> Cancel </a-btn>
        <a-btn variant="text" color="primary" @click="send" :loading="isInProgress"> Confirm </a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script>
import api from '@/services/api.service';
import { get } from 'lodash';

export default {
  data() {
    return {
      isVisible: true,
      resolve: null,
      next: null,
      isInProgress: false,
    };
  },
  props: {
    membership: {
      required: true,
      type: Object,
    },
  },
  methods: {
    async send() {
      this.isInProgress = true;
      try {
        await api.post('/memberships/activate-by-admin', { membershipId: this.membership._id });
        this.$emit('confirmed');
      } catch (e) {
        console.error(e);
        this.$store.dispatch('feedback/add', get(e, 'response.data.message', String(e)));
      } finally {
        this.isVisible = false;
        this.isInProgress = false;
      }
    },
    cancel() {
      this.isVisible = false;
      this.$emit('cancel');
    },
  },
};
</script>
