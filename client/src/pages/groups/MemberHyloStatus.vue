<template>
  <a-btn
    v-if="member"
    :disabled="loading"
    :href="member.hyloUrl"
    target="_blank"
    small
    color="#00AD87"
    v-on:click.prevent="openProfile"
    >See on Hylo</a-btn
  >

  <v-dialog v-else-if="hyloGroup" v-model="isConfirming" width="300">
    <template v-slot:activator="{ on, attrs }">
      <a-btn :disabled="loading" v-bind="attrs" v-on:click.prevent="on.click" small>Invite to Hylo</a-btn>
    </template>
    <v-card>
      <v-card-title> Confirm Invitation </v-card-title>
      <v-card-text> Do you want to invite "{{ userName }}" to the group "{{ hyloGroup.name }}" on Hylo? </v-card-text>
      <v-card-actions>
        <v-spacer />
        <a-btn text @click="isConfirming = false"> Cancel </a-btn>
        <a-btn text color="primary" @click="inviteToHylo" :loading="isAddingMember"> Invite </a-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import api from '@/services/api.service';
import { get } from 'lodash';
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
  data() {
    return {
      isConfirming: false,
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
    loading: {
      default: false,
      type: Boolean,
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
        this.isConfirming = false;
      }
    },
    openProfile() {
      if (this.member) {
        window.open(this.member.hyloUrl, '_blank');
      }
    },
  },
};
</script>
