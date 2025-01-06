<template>
  <a-dialog v-model="state.showConfirmDialog" max-width="500">
    <a-card>
      <a-card-title class="headline">Confirmation</a-card-title>
      <a-card-text>
        <p class="body-1">
          You are about to send an E-mail to {{ state.selectedMembers.length }}
          {{ state.selectedMembers.length === 1 ? 'member' : 'members' }}.<br />Are you sure you want to proceed?
        </p>
        <a-checkbox label="Also send a copy to myself" v-model="state.copy" />
      </a-card-text>
      <a-card-actions class="d-flex justify-end">
        <a-btn @click="state.showConfirmDialog = false" variant="text">Cancel</a-btn>
        <a-btn color="primary" :loading="state.isSubmitting" @click="submit">SEND NOW</a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
  <result-dialog
    v-model="state.showSubmitResult"
    :items="state.submitResults"
    title="Call for Responses"
    @close="state.showSubmitResult = false" />

  <confirm-membership-dialog
    v-if="state.memberToConfirm"
    :membership="state.memberToConfirm"
    @confirmed="
      state.memberToConfirm = null;
      loadMembers;
    "
    @cancel="state.memberToConfirm = null" />
  <app-dialog
    :modelValue="props.modelValue"
    @update:modelValue="closeDialog"
    @close="closeDialog"
    scrollable
    textRevertOverflow>
    <template v-slot:title>
      <span class="d-flex align-start"><a-icon class="mr-2">mdi-bullhorn</a-icon>Call for Responses</span>
    </template>
    <template v-slot:text>
      <a-text-field v-model="state.subject" label="Subject" variant="filled" />
      <a-textarea rows="7" v-model="state.body" label="Message" hide-details />
      <div v-if="showMissingMagicLinkWarning" class="mt-2 text-error">
        Message does not contain %CFS_MAGIC_LINK%! Members will not be able to automatically log in.
      </div>
      <div class="d-flex justify-end align-center mt-3">
        <span v-if="!submittable" class="mr-2">Select at least one member below</span>
        <a-btn variant="text" @click="closeDialog">Cancel</a-btn>
        <a-btn color="primary" :disabled="!submittable" @click="state.showConfirmDialog = true">Send...</a-btn>
      </div>
    </template>
    <template v-slot:more>
      <a-card-title class="pt-0">Select members</a-card-title>
      <a-card-subtitle>{{ state.selectedMembers.length }} of {{ activeMembers.length }} selected</a-card-subtitle>
      <a-card-text class="pt-0" style="min-height: 150px">
        <a-data-table
          v-model="state.selectedMembers"
          :items="activeMembers"
          :headers="state.headers"
          showSelect
          itemValue="_id"
          :loading="state.isLoadingMembers"
          hideDefaultFooter
          actionsSlot>
          <template v-slot:actions="{ item }">
            <a-btn v-if="item.meta.status === 'pending'" @click="state.memberToConfirm = item">Confirm</a-btn>
          </template>
        </a-data-table>
      </a-card-text>
    </template>
  </app-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import confirmMembershipDialog from '@/components/shared/ConfirmMembershipDialog.vue';
import resultDialog from '@/components/ui/ResultDialog.vue';
import api from '@/services/api.service';
import { get } from 'lodash';

import appDialog from '@/components/ui/Dialog2.vue';

const store = useStore();
const route = useRoute();

const defaultSubject = 'Request to submit a survey';

const defaultBody = `Hello

Please use the following link to automatically login and start the survey:
%CFS_MAGIC_LINK%

All the best
`;

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  selectedSurvey: {
    type: undefined,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const state = reactive({
  members: [],
  groupId: null,
  selectedMembers: [],
  subject: defaultSubject,
  body: defaultBody,
  copy: false,
  headers: [
    { title: 'id', value: '_id', sortable: true },
    { title: 'name', value: 'name', sortable: true },
    { title: 'email', value: 'email', sortable: true },
    { title: 'actions', value: 'actions', sortable: true },
  ],
  showConfirmDialog: false,
  memberToConfirm: null,
  isLoadingMembers: false,
  isSubmitting: false,
  showSubmitResult: false,
  submitResults: [],
});

const activeMembers = computed(() => {
  return state.members.map((m) => ({
    ...m,
    name: (m.user && m.user.name) || (m.meta && m.meta.invitationName),
    email: (m.user && m.user.email) || (m.meta && m.meta.invitationEmail),
    isSelectable: m.meta.status === 'active',
  }));
});
const submittable = computed(() => {
  return props.selectedSurvey !== null && state.selectedMembers.length !== 0;
});
const showMissingMagicLinkWarning = computed(() => {
  return state.body.search('%CFS_MAGIC_LINK%') === -1;
});

async function loadMembers() {
  state.isLoadingMembers = true;
  try {
    const { data: members } = await api.get(`/memberships?group=${state.groupId}&populate=true`);
    state.members = members;
  } catch (e) {
    console.error(e);
    store.dispatch('feedback/add', get(e, 'response.data.message', String(e)));
    closeDialog();
  } finally {
    state.isLoadingMembers = false;
  }
}
async function submit() {
  state.isSubmitting = true;
  try {
    const members = state.selectedMembers;
    const survey = props.selectedSurvey._id;
    await api.post('/call-for-submissions/send', {
      survey,
      members,
      subject: state.subject,
      body: state.body,
      // survey group
      group: state.groupId,
      copy: state.copy,
      // submit CFS response to current active group
      submitTo: route.params.id,
    });
    state.submitResults = [
      {
        title: 'Success:',
        body: 'Emails are sent out!',
      },
    ];
    state.showSubmitResult = true;
  } catch (e) {
    console.error(e);
    state.submitResults = [
      {
        title: 'Error:',
        body: get(e, 'response.data.message', String(e)),
        error: true,
      },
    ];
    state.showSubmitResult = true;
  } finally {
    state.isSubmitting = false;
    state.showConfirmDialog = false;
  }
}

function closeDialog() {
  state.selectedMembers = [];
  emit('update:modelValue', false);
}

watch(
  () => props.modelValue,
  async (newVal) => {
    // if the dialog will be displayed
    if (newVal) {
      const groupId = props.selectedSurvey.meta.group.id;
      if (groupId) {
        state.groupId = groupId;
        await loadMembers();
      }
      state.subject = `Request to submit survey '${props.selectedSurvey.name}'`;
    }
  }
);
</script>
