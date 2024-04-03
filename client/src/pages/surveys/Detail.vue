<template>
  <a-container v-if="entity && show" class="survey-detail bg-white">
    <div class="d-flex justify-end mb-4 survey-detail-nav">
      <a-btn v-if="editable" class="mx-2" :to="`/groups/${$route.params.id}/surveys/${entity._id}/edit`">
        <a-icon>mdi-pencil</a-icon>
        <span class="ml-2">Edit</span>
      </a-btn>
      <a-btn class="mx-2" :to="`/submissions?survey=${entity._id}`">
        <a-icon>mdi-table</a-icon>
        <span class="ml-2">Results</span>
      </a-btn>
    </div>

    <h1 class="text-heading">{{ entity.name }}</h1>
    <div v-if="surveyInfo" class="survey-info">
      <div class="survey-description" v-if="surveyInfo.description">
        {{ surveyInfo.description }}
      </div>
      <div class="text-secondary survey-info-submissions-count">
        {{ surveyInfo.submissions }}
        {{ surveyInfo.submissions === 1 ? 'submission' : 'submissions' }}
      </div>
      <div v-if="surveyInfo.latestSubmission" class="text-secondary survey-info-latest-submission">
        Latest submission on {{ surveyInfo.latestSubmission.dateModified }}
      </div>
    </div>

    <div class="pt-8 pb-4 d-flex justify-center start-button-container bg-white">
      <div>
        <btn-dropdown
          :label="'Start Survey'"
          :show-drop-down="isAdminOfAnyGroup && isAllowedToSubmit.allowed"
          :disabled="!isAllowedToSubmit.allowed"
          @click="startDraft(entity)"
          x-large
          color="primary"
          top
          left>
          <a-list max-width="260">
            <a-list-item @click="startDraft(entity)">
              <a-list-item-title>Start survey</a-list-item-title>
              <div class="multiline-subtitle">Start a survey as the user you are signed in with</div>
            </a-list-item>
            <a-list-item @click="showSelectMember = true">
              <a-list-item-title>Start survey as a member</a-list-item-title>
              <div class="multiline-subtitle">Select the member for whom you want to start the survey</div>
            </a-list-item>
          </a-list>
        </btn-dropdown>

        <div class="my-3 d-flex justify-center">
          <a-btn
            color="primary"
            variant="text"
            large
            :loading="download.loading"
            @click="downloadPrintablePdf(entity._id)">
            Print Blank Survey
          </a-btn>
        </div>

        <div class="text-secondary text-center submission-rights-hint" v-if="!isAllowedToSubmit.allowed">
          {{ isAllowedToSubmit.message }}
        </div>

        <member-selector
          :show="showSelectMember"
          @hide="showSelectMember = false"
          @selected="startDraftAs(entity, $event)" />
      </div>
    </div>
  </a-container>
  <a-container cssHeight100 cssDisplayCenterOfPage v-else>
    <a-progress-circular :size="50" />
  </a-container>
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
      this.$router.push({
        name: 'group-survey-submissions-new',
        params: { id: this.$route.params.id, surveyId: survey._id },
      });
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
    const { surveyId } = this.$route.params;
    const { group } = this.$route.query;

    if (group) {
      // see analysis in https://gitlab.com/our-sci/software/surveystack/-/merge_requests/230#note_1286909610
      await autoSelectActiveGroup(this.$store, group);
    }

    const { data: entity } = await api.get(`/surveys/${surveyId}?version=latest`);

    if (entity.resources) {
      //also fetch resources here in case survey is not pinned, so it's available if device goes offline
      await this.$store.dispatch('resources/fetchResources', entity.resources);
    }

    this.entity = entity;

    try {
      // load date of latestSubmission and number of submissions. This is not prefetched by means, so it will throw when offline
      const { data: surveyInfo } = await api.get(`/surveys/info?id=${surveyId}`);
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
        query: { redirect: this.$route.path, autoJoin: true },
      });
    }
  },
};
</script>
,
<style scoped lang="scss">
.survey-detail {
  height: 100%;
}

.survey-description {
  margin: 16px 0px;
  white-space: pre-wrap;
}

.start-button-container {
  background: linear-gradient(to bottom, rgba(80, 44, 155, 0) 0%, rgba(255, 255, 255, 0.85) 50%);
  bottom: 0;
  left: 0;
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
