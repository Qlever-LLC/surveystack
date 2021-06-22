<template>
  <v-container v-if="entity && show">
    <div class="d-flex justify-end">
      <v-btn v-if="editable" class="mx-2" :to="`/surveys/${entity._id}/edit`">
        <v-icon>mdi-pencil</v-icon>
        <span class="ml-2">Edit</span>
      </v-btn>
      <v-btn class="mx-2" :to="`/submissions?survey=${entity._id}`">
        <v-icon>mdi-table</v-icon>
        <span class="ml-2">Results</span>
      </v-btn>
    </div>

    <h1>{{ entity.name }}</h1>
    <div v-if="surveyInfo" class="survey-info">
      <div class="survey-description" v-if="surveyInfo.description">
        {{ surveyInfo.description }}
      </div>
      <div class="text--secondary">
        {{ surveyInfo.submissions }}
        {{ surveyInfo.submissions === 1 ? "submission" : "submissions" }}
      </div>
      <div v-if="surveyInfo.latestSubmission" class="text--secondary">
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
        <div class="mt-2 text--secondary text-center" v-if="!isAllowedToSubmit">
          {{ submissionRightsHint }}
        </div>
      </div>
    </div>

  </v-container>
</template>

<script>
import api from '@/services/api.service';

export default {
  data() {
    return {
      entity: null,
      surveyInfo: null,
      show: false,
    };
  },
  methods: {
    startDraft(survey) {
      const group = this.$store.getters['memberships/activeGroup'];
      this.$store.dispatch('submissions/startDraft', { survey, group });
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

      if (
        this.entity
        && this.entity.meta
        && this.entity.meta.creator === user._id
      ) {
        return true;
      }

      if (!this.entity.meta.group || !this.entity.meta.group.id) {
        return false;
      }

      const g = this.memberships.find(
        m => m.group._id === this.entity.meta.group.id,
      );
      if (g && g.role === 'admin') {
        return true;
      }
      return false;
    },
    isAllowedToSubmit() {
      const { submissions, isLibrary } = this.entity.meta;

      if (isLibrary) {
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
        const match = groups.find(
          group => group._id === this.entity.meta.group.id,
        );
        console.log('match', match);
        if (match) {
          return true;
        }
      }

      return false;
    },
    submissionRightsHint() {
      const { submissions, isLibrary } = this.entity.meta;

      if (isLibrary) {
        return 'This is a library survey, please choose another survey to submit.';
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
    const { data: entity } = await api.get(`/surveys/${id}`);
    this.entity = entity;

    const { data: surveyInfo } = await api.get(`/surveys/info?id=${id}`);
    this.surveyInfo = surveyInfo;

    const user = this.$store.getters['auth/user'];
    this.$store.dispatch('memberships/getUserMemberships', user._id);

    const { submissions, isLibrary } = this.entity.meta;


    if (!submissions || submissions === 'public' || isLibrary) {
      this.show = true;
      return;
    }

    if (this.$store.getters['auth/isLoggedIn']) { // let ui handle issues if user is already logged in
      this.show = true;
      return;
    }

    this.$router.push({
      name: 'auth-login',
      params: { redirect: this.$route.path, autoJoin: true },
    });
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
  background: linear-gradient(to bottom,  rgba(255,255,255,0) 0%,rgba(255,255,255,0.85) 50%);
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
}

.survey-info {
  padding-bottom: 100px;
}
</style>
