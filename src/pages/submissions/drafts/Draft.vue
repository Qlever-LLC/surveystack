
<template>
  <div>
    <app-draft-component
      v-if="!loading"
      :survey="survey"
      :submission="submission"
      @persist="persist"
      @submit="submit"
    />
    <div v-else>LOADING...</div>
  </div>
</template>


<script>
import api from '@/services/api.service';
import appMixin from '@/components/mixin/appComponent.mixin';
import * as db from '@/store/db';
import * as utils from '@/utils/surveys';

import appDraftComponent from '@/components/survey/drafts/DraftComponent.vue';

export default {
  mixins: [appMixin],
  components: {
    appDraftComponent,
  },
  data() {
    return {
      submission: null,
      survey: null,
      loading: false,
    };
  },
  methods: {
    persist({ submission }) {
      db.persistSubmission(submission);
    },
    async submit({ payload }) {
      try {
        await api.post('/submissions', payload);
        this.$router.push(`/surveys/${this.survey._id}`);
      } catch (error) {
        console.log(error);
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
      this.submission.survey,
    );

    const positions = utils.getSurveyPositions(this.survey);
    // this.setNavbarContent({
    //   title: this.survey.name,
    //   subtitle: `
    //     <span><span class="question-title-chip">Version ${this.submission.meta.version}</span></span>
    //     <span class="question-title-chip">${positions.length} Questions</span>
    //   `,
    // });

    this.loading = false;
  },
};
</script>
