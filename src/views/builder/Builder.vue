
<template>
  <div>
    <survey-builder
      v-if="!loading"
      :survey="survey"
      @submit="submitSubmission"
      @onSubmit="submitSurvey"
      @onDelete="onDelete"
    />
    <div v-else>LOADING...</div>
  </div>
</template>

<script>
import ObjectId from 'bson-objectid';
import _ from 'lodash';
import moment from 'moment';
import api from '@/services/api.service';

import SurveyBuilder from '@/components/builder/SurveyBuilder.vue';


const currentDate = moment().toISOString();


export default {
  components: {
    SurveyBuilder,
  },
  data() {
    return {
      loading: true,
      editMode: false,
      instance: {},
      survey: {
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
      },

    };
  },
  methods: {
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
      const method = this.editMode ? 'put' : 'post';
      const url = this.editMode ? `/surveys/${this.survey._id}` : '/surveys';

      try {
        await api.customRequest({
          method, url, data: this.survey,
        });
        // this.$router.push('/surveys/browse');
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
  },

  async created() {
    this.editMode = !this.$route.matched.some(
      ({ name }) => name === 'surveys-new',
    );

    this.survey._id = ObjectId();
    this.survey.dateCreated = new Date();

    if (this.editMode) {
      try {
        const { id } = this.$route.params;
        this.survey._id = id;
        const { data } = await api.get(`/surveys/${this.survey._id}`);
        this.survey = { ...this.survey, ...data };
      } catch (e) {
        console.log('something went wrong:', e);
      }
    }

    this.loading = false;
  },
};
</script>
