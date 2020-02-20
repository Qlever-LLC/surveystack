<template>
  <div>
    <survey-builder
      :key="sessionId"
      v-if="!loading"
      :survey="survey"
      :editMode="!isNew"
      @submit="submitSubmission"
      @onSaveDraft="submitSurvey(true)"
      @onPublish="submitSurvey(false)"
      @onDelete="onDelete"
    />
    <div v-else>LOADING...</div>

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
      @confirm="$emit('onDelete');"
    >
      <template v-slot:title>Confirm your action</template>
      <template>
        Delete survey
        <strong>{{survey._id}}</strong>
        for sure?
      </template>
    </app-dialog>

    <v-snackbar
      v-model="showSnackbar"
      :timeout="0"
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

import appDialog from '@/components/ui/Dialog.vue';
import SurveyBuilder from '@/components/builder/SurveyBuilder.vue';


const currentDate = moment().toISOString();
const emptySurvey = {
  _id: '',
  name: '',
  dateCreated: currentDate,
  dateModified: currentDate,
  latestVersion: 1,
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
  props: [
    'isNew',
  ],
  data() {
    return {
      showConflictModal: false,
      sessionId: new ObjectId().toString(),
      loading: true,
      instance: {},
      survey: _.cloneDeep(emptySurvey),
      showSnackbar: false,
      snackbarMessage: '',
      showDeleteModal: false,
    };
  },
  methods: {
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
      try {
        console.log('submitting', payload);
        await api.post('/submissions', payload);
        // this.$router.push(`/surveys/${this.survey._id}`);
        this.snackbarMessage = 'Submitted';
        this.showSnackbar = true;
      } catch (error) {
        this.snackbarMessage = error.response.data.message;
        this.showSnackbar = true;
        console.log(error);
      }
    },
    async submitSurvey(isDraft) {
      const tmp = _.cloneDeep(this.survey);

      if (!isDraft && tmp.revisions.length > 0) {
        tmp.latestVersion = tmp.revisions[tmp.revisions.length - 1].version;
      }

      const method = this.isNew ? 'post' : 'put';
      const url = this.isNew ? '/surveys' : `/surveys/${tmp._id}`;
      console.log('submitting survey', tmp);

      try {
        await api.customRequest({
          method, url, data: tmp,
        });
        if (this.isNew) {
          this.$router.push(`/surveys/${tmp._id}/edit`);
        }

        this.snackbarMessage = 'Saved Survey';
        this.showSnackbar = true;
      } catch (error) {
        if (error.response.status === 409) {
          this.showConflictModal = true;
        } else {
          this.snackbarMessage = error.response.data.message;
          this.showSnackbar = true;
        }
      }

      this.sessionId = new ObjectId().toString();
      this.survey = tmp;
    },
    async refresh() {
      this.survey = _.cloneDeep(emptySurvey);
      if (this.isNew) {
        this.survey._id = ObjectId();
        this.survey.dateCreated = moment().toISOString();
      } else {
        try {
          const { id } = this.$route.params;
          this.survey._id = id;
          const { data } = await api.get(`/surveys/${this.survey._id}`);
          this.survey = { ...this.survey, ...data };
        } catch (e) {
          console.log('something went wrong:', e);
        }
      }

      this.sessionId = new ObjectId().toString();
      this.loading = false;
    },
  },
  watch: {
    async isNew() {
      console.log('isnew', this.isNew);
      await this.refresh();
    },
  },
  async created() {
    console.log('new is', this.isNew);
    await this.refresh();
  },
};
</script>
