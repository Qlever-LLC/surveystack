<template>
  <v-container v-if="entity && show" class="survey-detail">
    <div class="d-flex justify-end mb-4 survey-detail-nav">
      <v-btn v-if="editable" class="mx-2" :to="`/surveys/${entity._id}/edit`">
        <v-icon>mdi-pencil</v-icon>
        <span class="ml-2">Edit</span>
      </v-btn>
      <v-btn class="mx-2" :to="`/submissions?survey=${entity._id}`">
        <v-icon>mdi-table</v-icon>
        <span class="ml-2">Results</span>
      </v-btn>
    </div>

    <h1 class="heading--text">{{ entity.name }}</h1>
    <div v-if="surveyInfo" class="survey-info">
      <div class="survey-description" v-if="surveyInfo.description">
        {{ surveyInfo.description }}
      </div>
      <div class="text--secondary survey-info-submissions-count">
        {{ surveyInfo.submissions }}
        {{ surveyInfo.submissions === 1 ? 'submission' : 'submissions' }}
      </div>
      <div v-if="surveyInfo.latestSubmission" class="text--secondary survey-info-latest-submission">
        Latest submission on {{ surveyInfo.latestSubmission.dateModified }}
      </div>
    </div>

    <div class="pt-8 pb-4 d-flex justify-center start-button-container">
      <div class="text-center">
        <v-btn
          x-large
          color="primary"
          @click="startDraft(entity._id)"
          :disabled="!isAllowedToSubmit"
          class="start-button"
        >
          <v-icon>mdi-file-document-box-plus-outline</v-icon>
          <span class="ml-2">Start Survey</span>
        </v-btn>
        <div class="mt-2 text--secondary text-center submission-rights-hint" v-if="!isAllowedToSubmit">
          {{ submissionRightsHint }}
        </div>
      </div>
    </div>
  </v-container>
  <v-container fill-height v-else>
    <v-layout column justify-center align-center>
      <v-progress-circular :size="50" color="primary" indeterminate></v-progress-circular
    ></v-layout>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import { autoSelectActiveGroup } from '@/utils/memberships';

export default {
  props: {
    start: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      entity: null,
      surveyInfo: null,
      show: false,
    };
  },
  methods: {
    startDraft(survey) {
      this.$store.dispatch('submissions/startDraft', { survey });
    },
  },
  computed: {
    user() {
      return this.$store.getters['auth/user'];
    },
    memberships() {
      return this.$store.getters['memberships/memberships'];
    },
    editable() {
      if (!this.$store.getters['auth/isLoggedIn']) {
        return false;
      }
      const user = this.$store.getters['auth/user'];

      if (this.entity && this.entity.meta && this.entity.meta.creator === user._id) {
        return true;
      }

      if (!this.entity.meta.group || !this.entity.meta.group.id) {
        return false;
      }

      const g = this.memberships.find((m) => m.group._id === this.entity.meta.group.id);
      if (g && g.role === 'admin') {
        return true;
      }
      return false;
    },
    isAllowedToSubmit() {
      const { submissions, isLibrary } = this.entity.meta;

      if (isLibrary || this.isPublishedVersionEmpty) {
        return false;
      }

      if (!submissions || submissions === 'public') {
        // everyone may submit
        return true;
      }

      if (submissions === 'user' && this.$store.getters['auth/isLoggedIn']) {
        // logged in users may submit
        return true;
      }

      if (submissions === 'group' && this.$store.getters['auth/isLoggedIn']) {
        const groups = this.$store.getters['memberships/groups'];
        console.log(groups);
        const match = groups.find((group) => group._id === this.entity.meta.group.id);
        console.log('match', match);
        if (match) {
          return true;
        }
      }

      return false;
    },
    isPublishedVersionEmpty() {
      const publishedVersion = this.entity.revisions.find((revision) => revision.version === this.entity.latestVersion);
      return publishedVersion.controls.length === 0;
    },
    submissionRightsHint() {
      const { submissions, isLibrary } = this.entity.meta;

      if (isLibrary) {
        return 'This is a library survey, please choose another survey to submit.';
      }

      if (this.isPublishedVersionEmpty) {
        return 'The latest published version of this survey is empty. Please publish a new version to start a submission.';
      }

      if (!submissions || submissions === 'public') {
        return 'Everyone may submit to this survey.';
      }

      if (submissions === 'user') {
        return 'You must be signed in to submit to this survey.';
      }

      if (submissions === 'group') {
        return 'Only group members may submit to this survey.';
      }

      return 'Probably no one can submit to this survey';
    },
  },
  async created() {
    const { id } = this.$route.params;
    const { group } = this.$route.query;

    if (group) {
      this.$store.dispatch('surveys/fetchPinned'); // TODO do we need fetchPinned?
      await autoSelectActiveGroup(this.$store, group);
    }

    const { data: entity } = await api.get(`/surveys/${id}`);
    this.entity = entity;

    const { data: surveyInfo } = await api.get(`/surveys/info?id=${id}`);
    this.surveyInfo = surveyInfo;

    const user = this.$store.getters['auth/user'];
    this.$store.dispatch('memberships/getUserMemberships', user._id);

    const { submissions, isLibrary } = this.entity.meta;

    if (!submissions || submissions === 'public' || isLibrary) {
      this.show = true;
    } else if (this.$store.getters['auth/isLoggedIn']) {
      // let ui handle issues if user is already logged in
      this.show = true;
    } else {
      this.$router.push({
        name: 'auth-login',
        params: { redirect: this.$route.path, autoJoin: true },
      });
    }
    if (this.show && this.start && this.isAllowedToSubmit) {
      this.startDraft(this.entity._id);
    }
  },
};
</script>
,
<style scoped>
.survey-description {
  margin: 16px 0px;
  white-space: pre-wrap;
}

.start-button-container {
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.85) 50%);

  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
}

.survey-info {
  padding-bottom: 150px;
}

/* vuetify default for disabled buttons makes them */
.theme--light.v-btn.v-btn--disabled:not(.v-btn--flat):not(.v-btn--text):not(.v-btn--outlined) {
  background-color: #ccc !important;
}

.submission-rights-hint {
  max-width: 500px;
}
</style>
