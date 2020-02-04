
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

import {
  createInstance,
} from '@/utils/surveys';

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
  computed: {
    draftId() {
      return this.$route.params && this.$route.params.id;
    },
    surveyId() {
      return this.$route.query && this.$route.query.survey;
    },
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
    db.openDb();
    const { id: draftId } = this.$route.params;
    const { survey: surveyId } = this.$route.query;

    const isNewSubmission = !draftId;

    if (draftId) {
      /** Either fetch all submissions then use getter, or use GET_SUBMISSION action, which automatically does this. */
      // await this.$store.dispatch('submissions/fetchSubmissions');
      // this.$store.getters['submissions/getSubmission'](draftId);
      this.submission = await this.$store.dispatch('submissions/getSubmission', draftId);
      // TODO: handle submission not found, set error on page
    }

    this.survey = await this.$store.dispatch(
      'surveys/fetchSurvey',
      surveyId || (this.submission && this.submission.survey),
    );

    this.activeVersion = isNewSubmission
      ? this.survey.latestVersion
      : this.submission.meta.version;

    if (!draftId) {
      this.submission = createInstance(this.survey, this.activeVersion);
    }

    this.loading = false;
  },
};
</script>
