<template>
  <v-btn v-if="member" @click="addToHylo" :loading="isAddingMember" small color="#00AD87">See on Hylo</v-btn>
  <v-btn v-else-if="hyloGroup" @click="addToHylo" :loading="isAddingMember" small>Invite to Hylo</v-btn>
</template>

<script>
import api from '@/services/api.service';
import { get } from 'lodash';

export default {
  data() {
    return {
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
  },
  computed: {
    member() {
      return get(this.hyloGroup, 'members.items', []).find(
        (m) => get(m, 'surveyStackMembership._id') === this.membershipId
      );
    },
  },
  methods: {
    async addToHylo() {
      this.isAddingMember = true;
      try {
        this.integratedHyloGroup = (
          await api.post(`/hylo/invite-member-to-hylo-group`, {
            membershipId: this.membershipId,
          })
        ).data;
      } catch (e) {
        console.error(e);
      } finally {
        this.isAddingMember = false;
      }
    },
  },
};
</script>
