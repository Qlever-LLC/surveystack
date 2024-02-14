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
      <div>
        <btn-dropdown
          :label="'Start Survey'"
          :show-drop-down="isAdminOfAnyGroup && isAllowedToSubmit.allowed"
          :disabled="!isAllowedToSubmit.allowed"
          @click="startDraft(entity)"
          x-large
          color="primary"
          top
          left
        >
          <v-list class="pa-0 mx-auto" max-width="260">
            <v-list-item @click="startDraft(entity)">
              <v-list-item-content>
                <v-list-item-title>Start survey</v-list-item-title>
                <v-list-item-content class="multiline-subtitle">
                  Start a survey as the user you are signed in with
                </v-list-item-content>
              </v-list-item-content>
            </v-list-item>
            <v-list-item @click="showSelectMember = true">
              <v-list-item-content>
                <v-list-item-title>Start survey as a member</v-list-item-title>
                <v-list-item-content class="multiline-subtitle">
                  Select the member for whom you want to start the survey
                </v-list-item-content>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </btn-dropdown>

        <div class="my-3 d-flex justify-center">
          <v-btn color="primary" text large :loading="download.loading" @click="downloadPrintablePdf(entity._id)">
            Print Blank Survey
          </v-btn>
        </div>

        <div class="text--secondary text-center submission-rights-hint" v-if="!isAllowedToSubmit.allowed">
          {{ isAllowedToSubmit.message }}
        </div>

        <member-selector
          :show="showSelectMember"
          @hide="showSelectMember = false"
          @selected="startDraftAs(entity, $event)"
        />
      </div>
    </div>
  </v-container>
  <v-container fill-height v-else>
    <v-layout column justify-center align-center>
      <v-progress-circular :size="50" color="primary" indeterminate></v-progress-circular>
    </v-layout>
  </v-container>
</template>

<script>
import { parse as parseDisposition } from 'content-disposition';
import MemberSelector from '@/components/shared/MemberSelector.vue';
import BtnDropdown from '@/components/ui/BtnDropdown';
import { autoSelectActiveGroup } from '@/utils/memberships';
import { checkAllowedToSubmit } from '@/utils/submissions';
import downloadExternal from '@/utils/downloadExternal';
import api from '@/services/api.service';
import { get } from 'lodash';

export default {
  components: {
    BtnDropdown,
    MemberSelector,
  },
  data() {
    return {
      entity: null,
      surveyInfo: null,
      show: false,
      showSelectMember: false,
      download: {
        loading: false,
        error: null,
      },
    };
  },
  methods: {
    startDraft(survey) {
      this.$router.push({ name: 'new-submission', params: { surveyId: survey._id } });
    },
    startDraftAs(survey, selectedMember) {
      this.showSelectMember = false;
      if (selectedMember.user) {
        this.$router.push({
          name: 'new-submission',
          params: { surveyId: survey._id },
          query: { submitAsUserId: selectedMember.user._id },
        });
      }
    },
    async downloadPrintablePdf(survey) {
      this.download.loading = true;
      this.download.error = null;

      try {
        const { headers, data } = await api.get(`/surveys/${survey}/pdf`);
        const disposition = parseDisposition(headers['content-disposition']);
        downloadExternal(data, disposition.parameters.filename);
      } catch (e) {
        console.error('Failed to download printable PDF', e);
        this.$store.dispatch(
          'feedback/add',
          get(
            e,
            'response.data.message',
            'Sorry, something went wrong while downloading a PDF of paper version. Try again later.'
          )
        );
      } finally {
        this.download.loading = false;
      }
    },
  },
  computed: {
    user() {
      return this.$store.getters['auth/user'];
    },
    memberships() {
      return this.$store.getters['memberships/memberships'];
    },
    isAdminOfSurveyGroup() {
      return this.memberships.some((m) => m.group._id === this.entity.meta.group.id && m.role === 'admin');
    },
    isAdminOfAnyGroup() {
      return this.memberships.some((m) => m.role === 'admin');
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

      return this.isAdminOfSurveyGroup;
    },
    isAllowedToSubmit() {
      return checkAllowedToSubmit(
        this.entity,
        this.$store.getters['auth/isLoggedIn'],
        this.$store.getters['memberships/groups']
      );
    },
  },
  async created() {
    const { id } = this.$route.params;
    const { group } = this.$route.query;

    if (group) {
      // see analysis in https://gitlab.com/our-sci/software/surveystack/-/merge_requests/230#note_1286909610
      await autoSelectActiveGroup(this.$store, group);
    }

    const { data: entity } = await api.get(`/surveys/${id}?version=latest`);

    if (entity.resources) {
      //also fetch resources here in case survey is not pinned, so it's available if device goes offline
      await this.$store.dispatch('resources/fetchResources', entity.resources);
    }

    this.entity = entity;

    try {
      // load date of latestSubmission and number of submissions. This is not prefetched by means, so it will throw when offline
      const { data: surveyInfo } = await api.get(`/surveys/info?id=${id}`);
      this.surveyInfo = surveyInfo;
    } catch (error) {
      console.warn('unable to get survey stats infos. Maybe device is offline.');
    }

    const user = this.$store.getters['auth/user'];
    this.$store.dispatch('memberships/getUserMemberships', user._id);

    const { submissions, isLibrary } = this.entity.meta;

    if (
      !submissions ||
      submissions === 'public' ||
      isLibrary ||
      // let ui handle issues if user is already logged in
      this.$store.getters['auth/isLoggedIn']
    ) {
      this.show = true;
    } else {
      this.$router.push({
        name: 'auth-login',
        params: { redirect: this.$route.path, autoJoin: true },
      });
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
  background: linear-gradient(to bottom, rgba(80, 44, 155, 0) 0%, rgba(255, 255, 255, 0.85) 50%);

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

.multiline-subtitle {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  padding: 0;
  line-height: 1.3;
}
</style>
