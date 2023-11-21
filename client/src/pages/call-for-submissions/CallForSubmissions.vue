<template>
  <v-container>
    <h1>Call for Submissions</h1>

    <app-survey-selector
      :show="showSelectSurvey"
      :searchResults="searchResults"
      @hide="showSelectSurvey = false"
      @search="searchSurveys"
      @selected="selectSurvey"
    />
    <v-card class="my-2">
      <v-card-text>
        <label>Survey</label>
        <div class="mb-5 d-flex align-center">
          <v-btn @click="showSelectSurvey = true" color="primary" outlined>Select Survey</v-btn>
          <span v-if="selectedSurvey" class="mx-2">{{ selectedSurvey.name }}</span>
          <v-icon v-if="selectedSurvey" @click="selectedSurvey = null">mdi-close</v-icon>
        </div>

        <a-text-field v-model="subject" label="Subject" filled />
        <a-textarea rows="10" v-model="body" label="Message" filled hide-details />
        <div v-if="showMissingMagicLinkWarning" class="mt-2 error--text">
          Message does not contain %CFS_MAGIC_LINK%! Members will not be able to automatically log in.
        </div>
        <div class="d-flex justify-end align-center mt-3">
          <span v-if="!submittable" class="mr-2">Select a survey and at least one member below</span>
          <v-btn text @click="cancel">Cancel</v-btn>
          <v-btn color="primary" :disabled="!submittable" @click="showConfirmDialog = true">Send...</v-btn>
        </div>
      </v-card-text>
    </v-card>
    <v-card>
      <v-card-title>Select members</v-card-title>
      <v-card-subtitle>{{ selectedMembers.length }} selected</v-card-subtitle>
      <v-card-text>
        <v-data-table
          v-model="selectedMembers"
          :items="activeMembers"
          :headers="headers"
          disable-pagination
          hide-default-footer
          show-select
          item-key="_id"
          loading="isLoadingMembers"
        >
          <template v-slot:item.actions="{ item }">
            <app-confirm-membership-button
              v-if="item.meta.status === 'pending'"
              :membershipId="item._id"
              :email="item.meta.invitationEmail"
              @confirmed="loadMembers"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="showConfirmDialog" max-width="500">
      <v-card>
        <v-card-title class="headline">Confirmation</v-card-title>
        <v-card-text>
          <p class="body-1">
            You are about to send an E-mail to {{ selectedMembers.length }}
            {{ selectedMembers.length === 1 ? 'member' : 'members' }}.<br />Are you sure you want to proceed?
          </p>
          <a-checkbox label="Also send a copy to myself" v-model="copy" />
        </v-card-text>
        <v-card-actions class="d-flex justify-end">
          <v-btn @click="showConfirmDialog = false" text>Cancel</v-btn>
          <v-btn color="primary" :loading="isSubmitting" @click="submit">SEND NOW</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <result-dialog
      v-model="showSubmitResult"
      :items="submitResults"
      title="Call for Submissions"
      @close="showSubmitResult = false"
    />
  </v-container>
</template>

<script>
import appSurveySelector from '@/components/survey/SurveySelector.vue';
import appConfirmMembershipButton from '@/components/shared/ConfirmMembershipButton.vue';
import resultDialog from '@/components/ui/ResultDialog.vue';
import api from '@/services/api.service';
import { get } from 'lodash';
import ATextarea from '@/components/ui/ATextarea.vue';

const defaultSubject = 'Request to submit a survey';

const defaultBody = `Hello

Please use the following link to automatically login and start the survey:
%CFS_MAGIC_LINK%

All the best
`;

export default {
  components: {
    resultDialog,
    appSurveySelector,
    appConfirmMembershipButton,
    ATextarea,
  },
  data() {
    return {
      members: [],
      group: null,
      selectedMembers: [],
      searchResults: [],
      showSelectSurvey: false,
      selectedSurvey: null,
      subject: defaultSubject,
      body: defaultBody,
      copy: false,
      headers: [
        { text: 'id', value: '_id' },
        { text: 'name', value: 'name' },
        { text: 'email', value: 'email' },
        { text: 'actions', value: 'actions' },
      ],
      showConfirmDialog: false,
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
    async searchSurveys(q) {
      console.log('calling searchSurveys', q);
      const { data: searchResults } = await api.get(
        `/surveys?projections[]=name&projections[]=meta.dateModified&q=${q}`
      );
      this.searchResults = searchResults;
    },
    selectSurvey(survey) {
      this.selectedSurvey = survey;
      this.subject = `Request to submit survey '${survey.name}'`;
      this.showSelectSurvey = false;
    },
    cancel() {
      this.$router.back();
    },
    async submit() {
      this.isSubmitting = true;
      try {
        const members = this.selectedMembers.map((member) => member._id);
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
    const { group } = this.$route.query;
    if (group) {
      this.group = group;
      await this.loadMembers();
    }
  },
};
</script>
