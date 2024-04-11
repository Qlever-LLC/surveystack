<template>
  <a-dialog v-model="showDialog" width="300">
    <a-card>
      <a-card-title> Confirm Invitation </a-card-title>
      <a-card-text> Do you want to invite "{{ userName }}" to the group "{{ hyloGroup.name }}" on Hylo? </a-card-text>
      <a-card-actions>
        <a-spacer />
        <a-btn variant="text" @click="showDialog = false"> Cancel </a-btn>
        <a-btn variant="text" color="primary" @click="inviteToHylo" :loading="isAddingMember"> Invite </a-btn>
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
      showDialog: true,
      isAddingMember: false,
    };
  },
  props: {
    hyloGroup: {
      required: true,
      type: Object,
    },
    membershipId: {
      required: true,
      type: String,
    },
    userName: {
      required: true,
      type: String,
    },
  },
  computed: {
    member() {
      return get(this.hyloGroup, 'members.items', []).find(
        (m) => get(m, 'surveyStackMembership._id') === this.membershipId
      );
    },
  },
  methods: {
    async inviteToHylo() {
      this.isAddingMember = true;
      try {
        await api.post(`/hylo/invite-member-to-hylo-group`, {
          membershipId: this.membershipId,
        });
        this.$emit('updated');
      } catch (e) {
        console.error(e);
      } finally {
        this.isAddingMember = false;
        this.showDialog = false;
      }
    },
  },
};
</script>
