<template>
  <div>
    <survey-builder
      :key="sessionId"
      v-if="!loading"
      :survey="survey"
      :editMode="!isNew"
      @submit="submitSubmission"
      @onSubmit="submitSurvey"
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
        console.log(error);
      }
    },
    async submitSurvey() {
      const method = this.isNew ? 'post' : 'put';
      const url = this.isNew ? '/surveys' : `/surveys/${this.survey._id}`;

      try {
        await api.customRequest({
          method, url, data: this.survey,
        });
        this.$router.push(`/surveys/${this.survey._id}/edit`);
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
