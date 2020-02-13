
<template>
  <div>
    <survey-builder
      v-if="!loading"
      :survey="survey"
      :submission="submission"
      @persist="persist"
      @submit="submit"
      @onSubmit="onSubmit"
      @onDelete="onDelete"
    />
    <div v-else>LOADING...</div>
  </div>
</template>

<script>
import ObjectId from 'bson-objectid';
import _ from 'lodash';
import api from '@/services/api.service';

import SurveyBuilder from '@/components/builder/SurveyBuilder.vue';


export default {
  components: {
    SurveyBuilder,
  },
  data() {
    return {
      editMode: false,
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
    async submit({ payload }) {
      try {
        await api.post('/submissions', payload);
        // this.$router.push(`/surveys/${this.survey._id}`);
        this.snackbarMessage = 'Submitted';
        this.showSnackbar = true;
      } catch (error) {
        console.log(error);
      }
    },
    async onSubmit() {
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
    generateId() {
      this.survey._id = new ObjectId();
      this.showConflictModal = false;
    },
  },

  async created() {
    this.setNavbarContent(
      {
        title: 'Survey Builder',
      },
    );

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
        this.initialSurvey = _.cloneDeep(this.survey);
      } catch (e) {
        console.log('something went wrong:', e);
      }
    }
  },
};
</script>
