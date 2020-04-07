<template>
  <div>
    <survey-builder
      :key="sessionId"
      v-if="!loading"
      :survey="survey"
      :editMode="editMode"
      :freshImport="freshImport"
      @submit="submitSubmission"
      @onSaveDraft="submitSurvey(true)"
      @onPublish="submitSurvey(false)"
      @onDelete="onDelete"
      @import-survey="importSurvey"
      @export-survey="exportSurvey"
    />
    <div v-else>
      <v-progress-circular
        :size="50"
        color="primary"
        indeterminate
      ></v-progress-circular>
    </div>

    <app-dialog
      v-model="showConflictModal"
      @cancel="showConflictModal = false"
      @confirm="generateId"
    >
      <template v-slot:title>Conflict 409</template>
      <template>
        A survey with id
        <strong>{{survey._id}}</strong> already exists. Do you want to generate a different id?
      </template>
    </app-dialog>

    <app-dialog
      v-model="showDeleteModal"
      @cancel="showDeleteModal = false"
      @confirm="onDelete"
      width="400"
    >
      <template v-slot:title>Confirm your action</template>
      Are you sure you want to delete survey
      <strong>{{survey.name}}</strong> ({{survey._id}})?
    </app-dialog>

    <app-dialog
      v-model="showOverrideModal"
      @cancel="showOverrideModal = false"
      @confirm="onOverride"
      labelConfirm="Dismiss unpublished changes"
      width="400"
    >
      <template v-slot:title>Confirm your action</template>
      You have unpublished changes in your Draft. Importing a survey will dismiss these.
    </app-dialog>

    <v-dialog
      v-model="submitting"
      hide-overlay
      persistent
      width="300"
    >
      <v-card>
        <v-card-text class="pa-4">
          <span>Submitting</span>
          <v-progress-linear
            indeterminate
            class="mb-0"
          ></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="showSnackbar"
      :timeout="4000"
    >
      {{snackbarMessage | capitalize}}
      <v-btn
        color="pink"
        text
        @click="showSnackbar = false"
      >Close</v-btn>
    </v-snackbar>

  </div>
</template>

<script>
import ObjectId from 'bson-objectid';
import _ from 'lodash';
import moment from 'moment';
import api from '@/services/api.service';
import * as constants from '@/constants';

import appDialog from '@/components/ui/Dialog.vue';
import SurveyBuilder from '@/components/builder/SurveyBuilder.vue';


const currentDate = moment().toISOString(true);
const emptySurvey = {
  _id: '',
  name: '',
  dateCreated: currentDate,
  dateModified: currentDate,
  latestVersion: 1,
  specVersion: constants.SPEC_VERSION_SURVEY,
  revisions: [
    {
      dateCreated: currentDate,
      version: 1,
      controls: [],
    },
  ],
};

export default {
  components: {
    SurveyBuilder,
    appDialog,
  },
  data() {
    return {
      editMode: true,
      showConflictModal: false,
      sessionId: new ObjectId().toString(),
      loading: false,
      instance: {},
      survey: _.cloneDeep(emptySurvey),
      showSnackbar: false,
      snackbarMessage: '',
      showDeleteModal: false,
      showOverrideModal: false,
      importedSurvey: null,
      freshImport: false,
      submitting: false,
    };
  },
  methods: {
    navigateToLogin() {
      this.$router.push('/auth/login');
    },
    snack(message) {
      this.snackbarMessage = message;
      this.showSnackbar = true;
    },
    generateId() {
      this.survey._id = new ObjectId();
      this.showConflictModal = false;
    },
    async onDelete() {
      if (!this.showDeleteModal) {
        this.showDeleteModal = true;
        return;
      }
      try {
        await api.delete(`/surveys/${this.survey._id}`);
        this.$router.push('/surveys');
      } catch (error) {
        console.log(error);
      }
    },
    async submitSubmission({ payload }) {
      this.submitting = true;
      try {
        console.log('submitting', payload);
        await api.post('/submissions', payload);
        // this.$router.push(`/surveys/${this.survey._id}`);
        const message = 'Submitted';
        this.snack(message);
      } catch (error) {
        const { message } = error.response.data;
        this.snack(message);
        console.log(error);
      }
      this.submitting = false;
    },
    async submitSurvey(isDraft) {
      this.freshImport = false;
      const tmp = { ...this.survey };

      if (!isDraft && tmp.revisions.length > 0) {
        tmp.latestVersion = tmp.revisions[tmp.revisions.length - 1].version;
      }

      const method = this.editMode ? 'put' : 'post';
      const url = this.editMode ? `/surveys/${tmp._id}` : '/surveys';
      console.log('submitting survey', tmp);

      try {
        await api.customRequest({
          method, url, data: tmp,
        });
        if (!this.editMode) {
          this.editMode = true;
          this.$router.push(`/surveys/${tmp._id}/edit`);
        }

        this.snack(isDraft ? 'Saved Draft' : 'Published Survey');
      } catch (error) {
        if (error.response.status === 409) {
          this.showConflictModal = true;
        } else {
          const { message } = error.response.data;
          this.snack(message);
        }
        return;
      }

      this.sessionId = new ObjectId().toString();
      this.survey = { ...tmp };
    },

    async importSurvey({ target: { files: [file] } }) {
      try {
        const importedSurvey = JSON.parse(await file.text());
        this.importedSurvey = importedSurvey;
        if (this.survey.revisions.length !== this.survey.latestVersion) {
          this.showOverrideModal = true;
        } else {
          this.onOverride();
        }
      } catch (err) {
        console.error('error parsing Survey file', err);
        this.snack(`error parsing Survey file:${err}`);
      }
    },
    onOverride() {
      console.log('onOverride');
      this.showOverrideModal = false;

      try {
        const filtered = this.survey.revisions.filter(r => r.version <= this.survey.latestVersion);
        this.survey.revisions = filtered;
        const revision = this.importedSurvey.revisions[this.importedSurvey.revisions.length - 1];
        revision.version = this.survey.latestVersion + 1;
        this.survey.revisions.push(revision);
        this.freshImport = true;
        this.sessionId = new ObjectId().toString();
      } catch (err) {
        console.error('error parsing Survey file', err);
        this.snack(`error parsing Survey file:${err}`);
      }
    },
    exportSurvey() {
      const data = JSON.stringify(this.survey, null, 4);
      const element = document.createElement('a');
      element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`);
      element.setAttribute('download', `${this.survey.name}.json`);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    },
    async fetchData() {
      try {
        const { id } = this.$route.params;
        this.survey._id = id;
        const { data } = await api.get(`/surveys/${this.survey._id}`);
        this.survey = { ...this.survey, ...data };
      } catch (e) {
        console.log('something went wrong:', e);
      }
      this.sessionId = new ObjectId().toString();
      this.loading = false;
    },
  },
  async created() {
    this.editMode = !this.$route.matched.some(
      ({ name }) => name === 'surveys-new',
    );

    this.survey._id = ObjectId();
    this.survey.dateCreated = moment().toISOString(true);

    if (this.editMode) {
      this.loading = true;
      await this.fetchData();
    }
  },
};
</script>
