
<template>
  <div style="height: 100%;">
    <app-draft-component
      v-if="!loading"
      :survey="survey"
      :submission="submission"
      @persist="persist"
      @submit="submit"
    />
    <div v-else>LOADING...</div>
    <v-dialog
      v-model="submitting"
      hide-overlay
      persistent
      width="300"
    >
      <v-card>
        <v-card-text class="pa-4">
          <span>Submitting Draft</span>
          <v-progress-linear
            indeterminate
            class="mb-0"
          ></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>

    <result-dialog
      v-model="showResult"
      :items="resultItems"
      title="Result of Submission"
      persistent
      :to="survey && {name: 'surveys-detail', params: { id: survey._id }}"
    />
  </div>

</template>


<script>
import api from '@/services/api.service';
import appMixin from '@/components/mixin/appComponent.mixin';
import * as db from '@/store/db';
import * as utils from '@/utils/surveys';
import resultMixin from '@/components/ui/ResultsMixin';


import appDraftComponent from '@/components/survey/drafts/DraftComponent.vue';
import resultDialog from '@/components/ui/ResultDialog.vue';


export default {
  mixins: [appMixin, resultMixin],
  components: {
    appDraftComponent,
    resultDialog,
  },
  data() {
    return {
      submission: null,
      survey: null,
      loading: false,
      submitting: false,
    };
  },
  methods: {
    persist({ submission }) {
      db.persistSubmission(submission);
    },
    async submit({ payload }) {
      this.submitting = true;
      try {
        console.log('submitting', payload);
        const response = await api.post('/submissions', payload);
        // this.$router.push(`/surveys/${this.survey._id}`);
        this.result({ response });
      } catch (error) {
        console.log('Draft submit error:', error);
        const { message } = error.response.data;
        // this.snack(message); // does not exists here?
        this.result({ error });
      } finally {
        this.submitting = false;
      }
    },
  },
  async created() {
    this.loading = true;
    // TODO: figure out whether we need openDb?
    await new Promise(resolve => db.openDb(() => {
      resolve();
    }));
    const { id } = this.$route.params;

    this.submission = await this.$store.dispatch('submissions/fetchSubmission', id);
    // TODO: handle submission not found, set error on page

    this.survey = await this.$store.dispatch(
      'surveys/fetchSurvey',
      this.submission.meta.survey.id,
    );

    const positions = utils.getSurveyPositions(this.survey);

    this.loading = false;
  },
};
</script>
