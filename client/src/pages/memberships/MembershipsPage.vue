<template>
  <a-container class="basicListContainer">
    <basic-list
      listType="row"
      :entities="state.members"
      :menu="state.menu"
      :buttonNew="{
        title: 'Invite New Members',
        link: { name: 'group-members-new', params: { id: getActiveGroupId() } },
      }"
      :loading="state.isLoading">
      <template v-slot:title>
        <a-icon class="mr-2">mdi-account-multiple</a-icon>
        Members
        <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled>
          {{ state.members.length }}
        </a-chip>
      </template>
      <template v-slot:entityTitle="{ entity }">
        <template v-if="entity.meta && entity.meta.status === 'pending'">
          [Pending] {{ entity.meta.invitationEmail }}
          {{ entity.meta.invitationName ? ` - ${entity.meta.invitationName}` : '' }}
        </template>
        <template v-else>
          <a-icon v-if="entity.role === 'admin'" class="mr-2">mdi-crown-outline</a-icon>
          {{ entity.user.name }}
        </template>
      </template>
      <template v-slot:entitySubtitle="{ entity }">
        <template v-if="entity.meta && entity.meta.status === 'pending'">
          {{ entity.meta.dateSent ? `sent ${entity.meta.dateSent}` : 'Invitation not sent yet' }}
        </template>
        <template v-else>{{ entity.user.email }}</template>
      </template>
      <template v-slot:noValue> No Members available</template>
    </basic-list>
  </a-container>

  <confirm-membership-dialog
    v-if="!!state.memberToConfirm"
    :membership="state.memberToConfirm"
    @confirmed="
      state.memberToConfirm = null;
      initData();
    "
    @cancel="state.memberToConfirm = null" />

  <hylo-invite-member-dialog
    v-if="state.memberToInviteToHylo"
    :membershipId="state.memberToInviteToHylo._id"
    :hyloGroup="state.hyloGroup"
    :userName="state.memberToInviteToHylo.user.name"
    @updated="initData()" />
</template>

<script setup>
import BasicList from '@/components/ui/BasicList2.vue';
import { reactive } from 'vue';
import api from '@/services/api.service';
import { get } from 'lodash';
import { useGroup } from '@/components/groups/group';
import { useStore } from 'vuex';
import ConfirmMembershipDialog from '@/components/shared/ConfirmMembershipDialog.vue';
import hyloInviteMemberDialog from '@/components/integrations/HyloInviteMemberDialog.vue';

const store = useStore();
const { getActiveGroupId, isGroupAdmin } = useGroup();

const state = reactive({
  isLoading: false,
  members: [],
  menu: [
    {
      title: 'Confirm Membership',
      icon: 'mdi-open-in-new',
      action: (e) => () => (state.memberToConfirm = e),
      render: (e) => () => isGroupAdmin() && e.meta && e.meta.status === 'pending',
      buttonFixed: true,
    },
    {
      title: 'Edit',
      icon: 'mdi-open-in-new',
      action: (e) => `/groups/${getActiveGroupId()}/members/${e._id}/edit`,
      render: (e) => () => isGroupAdmin(),
      color: 'green',
    },
    /*
    TODO this is currently done in MembershipEdit.vue. In the next step, integrate the edit features like proposed in figma, or as an ordinary dialog
    {
      title: 'Set as Admin',
      icon: 'mdi-open-in-new',
      action: (e) => `/todo`,
      render: (e) => isGroupAdmin() && e.role !== 'admin',
    },
    {
      title: 'Set as Member',
      icon: 'mdi-open-in-new',
      action: (e) => `/todo`,
      render: (e) => isGroupAdmin() && e.role === 'admin',
    },
    {
      title: 'Remove',
      icon: 'mdi-open-in-new',
      action: (e) => `/todo`,
      render: (e) => isGroupAdmin() && e.role === 'admin',
    },
    */
    {
      title: 'Invite to Hylo',
      icon: 'mdi-open-in-new',
      action: (e) => () => inviteToHylo(e),
      render: (e) => () => isGroupAdmin() && e.meta.status === 'active' && state.hyloGroup && !isHyloGroupMember(e._id),
      buttonFixed: true,
    },
    {
      title: 'See on Hylo',
      icon: 'mdi-open-in-new',
      action: (e) => () => openHylo(e._id),
      render: (e) => () => isGroupAdmin() && state.hyloGroup && isHyloGroupMember(e._id),
      buttonFixed: true,
    },
  ],
  memberToConfirm: null,
  hyloGroup: null,
  memberToInviteToHylo: null,
});

initData();

async function initData() {
  state.isLoading = true;
  try {
    const { data: members } = await api.get(`/memberships?group=${getActiveGroupId()}&populate=true`);
    state.members = members;
    state.hyloGroup = (await api.get(`/hylo/integrated-group/${getActiveGroupId()}`)).data;
  } catch (e) {
    console.error(e);
    store.dispatch('feedback/add', get(e, 'response.data.message', String(e)));
  } finally {
    state.isLoading = false;
  }
}

function isHyloGroupMember(membershipId) {
  return !!get(state.hyloGroup, 'members.items', []).find((m) => get(m, 'surveyStackMembership._id') === membershipId);
}
function openHylo(membershipId) {
  const hyloMember = get(state.hyloGroup, 'members.items', []).find(
    (m) => get(m, 'surveyStackMembership._id') === membershipId
  );
  window.open(hyloMember.hyloUrl, '_blank');
}
function inviteToHylo(member) {
  state.memberToInviteToHylo = member;
}
</script>
<style scoped lang="scss"></style>
