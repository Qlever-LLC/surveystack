<template>
  <a-container>
    <h1>Call for Submissions</h1>
    <a-card class="my-2">
      <a-card-text>
        <a-text-field v-model="subject" label="Subject" variant="filled" />
        <a-textarea rows="10" v-model="body" label="Message" hide-details />
        <div v-if="showMissingMagicLinkWarning" class="mt-2 text-error">
          Message does not contain %CFS_MAGIC_LINK%! Members will not be able to automatically log in.
        </div>
        <div class="d-flex justify-end align-center mt-3">
          <span v-if="!submittable" class="mr-2">Select at least one member below</span>
          <a-btn variant="text" @click="cancel">Cancel</a-btn>
          <a-btn color="primary" :disabled="!submittable" @click="showConfirmDialog = true">Send...</a-btn>
        </div>
      </a-card-text>
    </a-card>
    <a-card>
      <a-card-title>Select members</a-card-title>
      <a-card-subtitle>{{ selectedMembers.length }} selected</a-card-subtitle>
      <a-card-text>
        <a-data-table
          v-model="selectedMembers"
          :items="activeMembers"
          :headers="headers"
          showSelect
          itemValue="_id"
          :loading="isLoadingMembers"
          hideDefaultFooter
          actionsSlot>
          <template v-slot:actions="{ item }">
            <a-btn v-if="item.meta.status === 'pending'" @click="memberToConfirm = item">Confirm</a-btn>
          </template>
        </a-data-table>
      </a-card-text>
    </a-card>

    <confirm-membership-dialog
      v-if="memberToConfirm"
      :membership="memberToConfirm"
      @confirmed="
        memberToConfirm = null;
        loadMembers;
      " />

    <a-dialog v-model="showConfirmDialog" max-width="500">
      <a-card>
        <a-card-title class="headline">Confirmation</a-card-title>
        <a-card-text>
          <p class="body-1">
            You are about to send an E-mail to {{ selectedMembers.length }}
            {{ selectedMembers.length === 1 ? 'member' : 'members' }}.<br />Are you sure you want to proceed?
          </p>
          <a-checkbox label="Also send a copy to myself" v-model="copy" />
        </a-card-text>
        <a-card-actions class="d-flex justify-end">
          <a-btn @click="showConfirmDialog = false" variant="text">Cancel</a-btn>
          <a-btn color="primary" :loading="isSubmitting" @click="submit">SEND NOW</a-btn>
        </a-card-actions>
      </a-card>
    </a-dialog>
    <result-dialog
      v-model="showSubmitResult"
      :items="submitResults"
      title="Call for Submissions"
      @close="showSubmitResult = false" />
  </a-container>
</template>

<script>
import confirmMembershipDialog from '@/components/shared/ConfirmMembershipDialog.vue';
import resultDialog from '@/components/ui/ResultDialog.vue';
import api from '@/services/api.service';
import { get } from 'lodash';

const defaultSubject = 'Request to submit a survey';

const defaultBody = `Hello

Please use the following link to automatically login and start the survey:
%CFS_MAGIC_LINK%

All the best
`;

export default {
  components: {
    resultDialog,
    confirmMembershipDialog,
  },
  data() {
    return {
      members: [],
      group: null,
      selectedMembers: [],
      selectedSurvey: null,
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
    };
  },
  methods: {
    async loadMembers() {
      this.isLoadingMembers = true;
      try {
        const { data: members } = await api.get(`/memberships?group=${this.group}&populate=true`);
        this.members = members;
      } catch (e) {
        console.error(e);
        this.$store.dispatch('feedback/add', get(e, 'response.data.message', String(e)));
      } finally {
        this.isLoadingMembers = false;
      }
    },
    cancel() {
      this.$router.back();
    },
    async submit() {
      this.isSubmitting = true;
      try {
        const members = this.selectedMembers;
        const survey = this.selectedSurvey._id;
        await api.post('/call-for-submissions/send', {
          survey,
          members,
          subject: this.subject,
          body: this.body,
          group: this.group,
          copy: this.copy,
        });
        this.submitResults = [
          {
            title: 'Success:',
            body: 'Emails are sent out!',
          },
        ];
        this.showSubmitResult = true;
      } catch (e) {
        console.error(e);
        this.submitResults = [
          {
            title: 'Error:',
            body: get(e, 'response.data.message', String(e)),
            error: true,
          },
        ];
        this.showSubmitResult = true;
      } finally {
        this.isSubmitting = false;
        this.showConfirmDialog = false;
      }
    },
  },
  watch: {
    selectedSurvey(newVal) {
      if (!newVal) {
        this.subject = defaultSubject;
      }
    },
  },
  computed: {
    activeMembers() {
      return this.members.map((m) => ({
        ...m,
        name: (m.user && m.user.name) || (m.meta && m.meta.invitationName),
        email: (m.user && m.user.email) || (m.meta && m.meta.invitationEmail),
        isSelectable: m.meta.status === 'active',
      }));
    },
    submittable() {
      return this.selectedSurvey !== null && this.selectedMembers.length !== 0;
    },
    showMissingMagicLinkWarning() {
      return this.body.search('%CFS_MAGIC_LINK%') === -1;
    },
  },
  async created() {
    const { id, surveyId } = this.$route.params;
    if (id) {
      this.group = id;
      await this.loadMembers();
    }
    if(surveyId){
      const {data} = await api.get(`/surveys/${surveyId}`)
      this.selectedSurvey = data
      this.subject = `Request to submit survey '${this.selectedSurvey.name}'`
    }
  },
};
</script>
