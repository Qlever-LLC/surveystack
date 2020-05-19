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
          <v-btn
            @click="showSelectSurvey = true"
            color="primary"
            outlined
          >Select Survey</v-btn>
          <span
            v-if="selectedSurvey"
            class="mx-2"
          >{{selectedSurvey.name}}</span>
          <v-icon
            v-if="selectedSurvey"
            @click="selectedSurvey = null"
          >mdi-close</v-icon>
        </div>

        <v-text-field
          v-model="subject"
          label="Subject"
          outlined
        />
        <v-textarea
          rows="10"
          v-model="body"
          label="Message"
          outlined
        />
        <div class="d-flex justify-end align-center">
          <span
            v-if="!submittable"
            class="mr-2"
          >Select a survey and at least one member below</span>
          <v-btn
            text
            @click="cancel"
          >Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!submittable"
            @click="showConfirmDialog = true"
          >Send...</v-btn>
        </div>
      </v-card-text>
    </v-card>
    <v-card>
      <v-card-title>Select members</v-card-title>
      <v-card-subtitle>{{selectedMembers.length}} selected</v-card-subtitle>
      <v-card-text>
        <v-data-table
          v-model="selectedMembers"
          :items="activeMembers"
          :headers="headers"
          disable-pagination
          hide-default-footer
          show-select
          item-key="_id"
        />
      </v-card-text>
    </v-card>

    <v-dialog
      v-model="showConfirmDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title>Confirmation</v-card-title>
        <v-card-text>
          You are about to send an email to {{selectedMembers.length}} members.<br />Are you sure you want to proceed?
        </v-card-text>
        <v-card-actions class="d-flex justify-end">

          <v-btn
            @click="showConfirmDialog = false"
            text
          >Cancel</v-btn>
          <v-btn color="primary">SEND NOW</v-btn>

        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
import appSurveySelector from '@/components/survey/SurveySelector.vue';

import api from '@/services/api.service';

const defaultSubject = 'Request to submit a survey';

const defaultBody = `Hello

Please use the following link to automatically login and start the survey:
$CFS_MAGIC_LINK$

All the best
`;

export default {
  components: {
    appSurveySelector,
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
      headers: [
        { text: 'id', value: '_id' },
        { text: 'name', value: 'user.name' },
        { text: 'email', value: 'user.email' },
      ],
      showConfirmDialog: false,
    };
  },
  methods: {
    async searchSurveys(q) {
      console.log('calling searchSurveys', q);
      const { data: searchResults } = await api.get(`/surveys?projections[]=name&projections[]=meta.dateModified&q=${q}`);
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
      return this.members.filter(member => member.meta.status === 'active');
    },
    submittable() {
      return this.selectedSurvey !== null && this.selectedMembers.length !== 0;
    },
  },
  async created() {
    const { group } = this.$route.query;
    if (group) {
      this.group = group;
      const { data: members } = await api.get(`/memberships?group=${this.group}&populate=true`);
      this.members = members;
    }
  },
};
</script>
