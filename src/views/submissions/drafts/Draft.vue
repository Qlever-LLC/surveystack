
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

<style scoped>
#relative-wrapper {
  max-width: 100%;
  height: 100%;
  width: 100%;
  margin: 0px;
  padding: 0px !important;
  min-height: 100%;
}

#footer-container {
  width: 100%;
  border-top: 1px solid #eee;
  height: 68px;
  position: fixed;
  bottom: 0px;
  left: 0px;
}

#draft-container {
  position: fixed;
  width: 100%;
  margin: 0px;
  padding: 0px !important;
  overflow: auto;
  overflow-x: hidden;
  bottom: 68px;
  top: 56px;
  left: 0px;
  /*
  height: calc(100% - 68px - 56px);
  max-height: calc(100% - 68px - 56px);
  */

  grid-column: 1;
  grid-row: 1;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr;
  will-change: transform;
}

#navigation-container {
  position: fixed;
  width: 100% !important;
  z-index: 4;
  margin-top: 56px;
  height: calc(100% - 68px - 56px);
  max-height: calc(100% - 68px - 56px);
  overflow: auto;
  grid-column: 1;
  grid-row: 1;
}

#draft-toolbar {
  grid-column: 1;
  grid-row: 1;
}

#draft-breadcrumbs {
  grid-column: 1;
  grid-row: 2;
}

#draft-body {
  will-change: transform;
  max-height: 100%;
  overflow: auto;
  grid-column: 1;
  grid-row: 3;
}

#transition-container {
  position: absolute;
  width: 100%;
  height: 100%;
  border-left: 1px solid #aaa;
  will-change: transform;
}
</style>


<style scoped>
.full {
  width: 100%;
}

.count {
  flex-grow: 0;
}

.title {
  /* align-items: center; */
  line-height: 1.5rem !important;
  width: 100%;
  display: flex;
  justify-content: space-between;
  flex-wrap: nowrap;
  margin: 0.2rem 0;
}

.inner-title {
  flex-basis: 0;
  flex-grow: 1;
}

.pack {
  flex-basis: 0 !important;
}

.app-chip {
  display: inline-flex;
  background-color: white;
  color: #ff5722;
  border-radius: 0.4rem;
  font-weight: bold;
  font-size: 80%;
  padding: 0.2rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
}

#top-level-container {
  padding-left: 0px !important;
  padding-right: 0px !important;
}

.slide-in-enter-active,
.slide-in-leave-active {
  transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-in-enter {
  transform: translateX(100vw);
}
.slide-in-leave-to {
  transform: translateX(-100vw);
}
.slide-in-leave {
  transform: translateX(0);
}
.slide-in-enter-to {
  transform: translateX(0);
}

.slide-out-enter-active,
.slide-out-leave-active {
  transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-out-enter {
  transform: translateX(-100vw);
}
.slide-out-leave-to {
  transform: translateX(100vw);
}
.slide-out-leave {
  transform: translateX(0);
}
.slide-out-enter-to {
  transform: translateX(0);
}
</style>

<style>
#question-title-chip {
  display: inline-flex;
  background-color: white;
  color: #ff5722;
  border-radius: 0.4rem;
  font-weight: bold;
  font-size: 80%;
  padding: 0.2rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
}
</style>
