
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
        this.$router.push('/surveys/browse');
      } catch (error) {
        console.log(error);
      }
    },
  },
  async created() {
    this.loading = true;
    // TODO: figure out whether we need openDb?
    db.openDb();
    const { id } = this.$route.params;

    /** Either fetch all submissions then use getter, or use GET_SUBMISSION action, which automatically does this. */
    // await this.$store.dispatch('submissions/fetchSubmissions');
    // this.$store.getters['submissions/getSubmission'](draftId);
    this.submission = await this.$store.dispatch('submissions/getSubmission', id);
    // TODO: handle submission not found, set error on page

    this.survey = await this.$store.dispatch(
      'surveys/fetchSurvey',
      this.submission.survey,
    );

    this.loading = false;
  },
};
</script>
