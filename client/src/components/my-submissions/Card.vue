<template>
  <v-card
    class="draft-card"
    :class="{
      selected,
      invalid: !survey || isArchived,
    }"
    @click.native="$emit('change-select', !selected)"
  >
    <div class="top d-flex flex-column flex-sm-row align-sm-center">
      <div v-if="!isArchived" class="status-bar" :class="classes.bar"></div>
      <div class="d-flex flex-column align-start">
        <app-group-breadcrumbs :path="submission.meta.group.path" disabled no-padding />
        <!--app-group-breadcrumbs
          :path="submission.meta.group.path"
          :disabled-suffix="submission._id"
          disabled
          no-padding
        /-->
        <div class="mt-2 d-flex align-center text-h6" :class="classes.surveyName">
          <v-icon v-if="!survey" class="mr-1" small>mdi-alert-outline</v-icon>
          {{ survey ? survey.name : 'Survey not found' }}
        </div>
      </div>

      <v-spacer></v-spacer>

      <div class="d-flex align-center justify-end">
        <template v-if="draft && survey">
          <draft-submit
            v-if="isReadyToSubmit"
            :submission="submission"
            class="flex-grow-1 flex-sm-grow-0"
            primary
            @click="isOpen.submitDraft = true"
          ></draft-submit>
          <draft-continue
            :submission="submission"
            :primary="!isReadyToSubmit"
            class="flex-grow-1 flex-sm-grow-0"
          ></draft-continue>
        </template>
        <template v-else-if="survey">
          <span v-if="isArchived" class="mr-4 grey--text font-weight-light body-2">
            {{ submission.meta.archivedReason }}
          </span>
          <submission-resubmit
            v-if="isCreator || isAdmin"
            :submission="submission"
            class="flex-grow-1 flex-sm-grow-0"
          ></submission-resubmit>
        </template>

        <v-menu offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" rounded small icon text outlined v-on="on">
              <v-icon small>mdi-dots-horizontal</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-if="draft && local && survey" @click="handleUploadDraft">
              <v-list-item-title>Move to Cloud</v-list-item-title>
            </v-list-item>
            <v-list-item v-if="draft && !local && survey" @click="handleDownloadDraft">
              <v-list-item-title>Move to Local (available offline)</v-list-item-title>
            </v-list-item>
            <v-list-item @click="handleExportJSON()">
              <v-list-item-title>Export as JSON</v-list-item-title>
            </v-list-item>
            <v-list-item @click="handleExportPDF()">
              <v-list-item-title>Export as PDF</v-list-item-title>
            </v-list-item>
            <v-list-item v-if="draft" @click="isOpen.deleteDraft = true">
              <v-list-item-title class="red--text">Delete</v-list-item-title>
            </v-list-item>
            <v-list-item v-if="!draft && (isCreator || isAdmin) && isArchived" @click="handleRestoreSubmission">
              <v-list-item-title> Restore </v-list-item-title>
            </v-list-item>
            <v-list-item v-if="!draft && (isCreator || isAdmin) && isArchived" @click="isOpen.deleteSubmission = true">
              <v-list-item-title class="red--text"> Delete </v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="!draft && (isCreator || isAdmin) && !isArchived"
              @click="isOpen.archiveSubmission = true"
            >
              <v-list-item-title class="red--text"> Archive </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <v-divider></v-divider>

    <div class="bottom d-flex flex-column flex-md-row align-md-center">
      <div class="d-flex align-center">
        <template v-if="draft">
          <v-chip v-if="!isReadyToSubmit" color="yellow lighten-3" small> Draft </v-chip>
          <v-chip v-else color="light-green lighten-3" small> Ready to submit </v-chip>
          <v-chip v-if="local" color="light-blue lighten-4" small> Local </v-chip>
          <v-chip v-else color="light-blue lighten-4" small> Server </v-chip>
        </template>
        <template v-else>
          <v-chip v-if="!isResubmitted" color="light-green lighten-3" small> Submitted </v-chip>
          <v-chip v-if="isResubmitted" color="light-green lighten-1" small> Resubmitted </v-chip>
          <v-chip v-if="isProxied" color="teal lighten-2" small> Proxied </v-chip>
          <v-chip v-if="isArchived" color="orange darken-1" small> Archived </v-chip>
        </template>
      </div>

      <v-spacer />

      <div class="d-flex flex-column flex-sm-row align-sm-center">
        <span v-if="dateSubmitted" class="text-caption">
          <span class="blue-grey--text">Submitted:</span>
          {{ dateSubmitted }}
        </span>
        <v-divider v-if="dateSubmitted && dateModified && $vuetify.breakpoint.smAndUp" vertical></v-divider>
        <span v-if="dateModified" class="text-caption">
          <span class="blue-grey--text">Modified:</span>
          {{ dateModified }}
        </span>
        <span class="text-caption"> <span class="blue-grey--text">ID:</span> {{ submission._id }} </span>
        <span class="text-caption"> Survey: {{ submission.meta.survey.id }} </span>
      </div>
    </div>

    <draft-delete v-model="isOpen.deleteDraft" :submission="submission"></draft-delete>

    <submission-delete v-model="isOpen.deleteSubmission" :submission="submission"></submission-delete>

    <submission-archive-dialog
      v-model="isOpen.archiveSubmission"
      maxWidth="50rem"
      labelConfirm="Archive"
      @cancel="isOpen.archiveSubmission = false"
      @confirm="handleArchiveSubmission"
    >
      <template #title>Archive Submission</template>
    </submission-archive-dialog>

    <confirm-submission-dialog
      v-model="isOpen.submitDraft"
      :id="submission._id"
      :groupId="submission.meta.group.id"
      :submitAsUser="submission.meta.submitAsUser"
      :dateSubmitted="submission.meta.dateSubmitted"
      @set-group="handleSetGroup"
      @submit="handleSubmitDraft"
    />

    <result-dialog
      v-model="isOpen.submitResult"
      title="Result of Submission"
      :items="resultItems"
      :survey="survey"
      :submission="submission"
    />
  </v-card>
</template>

<script>
import { computed, reactive, ref } from '@vue/composition-api';
import SubmissionArchiveDialog from '@/components/survey/drafts/SubmissionArchiveDialog.vue';
import DraftContinue from './actions/DraftContinue.vue';
import DraftDelete from './actions/DraftDelete.vue';
import DraftSubmit from './actions/DraftSubmit.vue';
import SubmissionDelete from './actions/SubmissionDelete.vue';
import SubmissionResubmit from './actions/SubmissionResubmit.vue';
import ConfirmSubmissionDialog from '@/components/survey/drafts/ConfirmSubmissionDialog.vue';
import ResultDialog from '@/components/ui/ResultDialog.vue';
import downloadExternal from '@/utils/downloadExternal';
import api from '@/services/api.service';
import { parse as parseDisposition } from 'content-disposition';
import appGroupBreadcrumbs from '@/components/groups/Breadcrumbs.vue';

export default {
  components: {
    appGroupBreadcrumbs,
    DraftDelete,
    DraftContinue,
    DraftSubmit,
    SubmissionDelete,
    SubmissionResubmit,
    SubmissionArchiveDialog,
    ConfirmSubmissionDialog,
    ResultDialog,
  },
  props: {
    submission: {
      type: Object,
      required: true,
    },
    surveys: {
      type: Array,
      default: () => [],
    },
    selected: {
      type: Boolean,
      default: false,
    },
    draft: {
      type: Boolean,
      default: false,
    },
    local: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['change-select'],
  setup(props, { root }) {
    const isOpen = reactive({
      deleteDraft: false,
      deleteSubmission: false,
      archiveSubmission: false,
      submitDraft: false,
      submitResult: false,
    });
    const resultItems = ref([]);

    const userId = computed(() => root.$store.getters['auth/user']._id);
    const chipColor = computed(() => (props.selected ? 'secondary' : undefined));
    const isCreator = computed(() =>
      props.submission.meta.submitAsUser
        ? props.submission.meta.submitAsUser._id === userId.value
        : props.submission.meta.creator === userId.value
    );
    const isProxied = computed(() => !!props.submission.meta.proxyUserId || !!props.submission.meta.submitAsUser);
    const isResubmitted = computed(() => !!props.submission.meta.resubmitter);
    const isArchived = computed(() => !!props.submission.meta.archived);
    const isReadyToSubmit = computed(() =>
      props.submission.meta.status.some((item) => item.type === 'READY_TO_SUBMIT')
    );
    const isAdmin = computed(() => {
      const memberships = root.$store.getters['memberships/memberships'];
      return memberships.some(
        (membership) => membership.group._id === props.submission.meta.group.id && membership.role === 'admin'
      );
    });
    const dateSubmitted = computed(() =>
      props.submission.meta.dateSubmitted ? new Date(props.submission.meta.dateSubmitted).toLocaleString() : undefined
    );
    const dateModified = computed(() =>
      props.submission.meta.dateModified ? new Date(props.submission.meta.dateModified).toLocaleString() : undefined
    );
    const survey = computed(() => props.surveys.find((item) => item._id === props.submission.meta.survey.id));

    const classes = computed(() => {
      const bar = [];
      if (props.draft || isCreator.value) {
        bar.push('light-blue darken-3');
      } else if (isProxied.value) {
        bar.push('lime darken-1');
      }

      const surveyName = [];
      if (!survey.value || isArchived.value) {
        surveyName.push('blue-grey--text font-weight-light');
      } else if (isProxied.value) {
        surveyName.push('lime--text text--darken-2 font-weight-medium');
      } else if (isCreator.value) {
        surveyName.push('blue--text text--darken-3 font-weight-medium');
      }

      return {
        bar,
        surveyName,
      };
    });

    const handleDownloadDraft = () => {
      root.$store.dispatch('myDrafts/saveLocalDrafts', [props.submission]);
    };

    const handleUploadDraft = () => {
      root.$store.dispatch('myDrafts/saveRemoteDrafts', [props.submission]);
    };

    const handleSubmitDraft = async () => {
      resultItems.value = await root.$store.dispatch('myDrafts/submitDrafts', [props.submission]);
    };

    const handleSetGroup = (id) => {
      const availableGroups = root.$store.getters['memberships/groups'];
      const match = availableGroups.find((item) => item._id === id);
      if (match) {
        props.submission.meta.group = { id, path: match.path };
      }
    };

    const handleArchiveSubmission = async (reason) => {
      await root.$store.dispatch('mySubmissions/archiveSubmissions', {
        ids: [props.submission._id],
        reason,
      });
    };

    const handleRestoreSubmission = () => {
      root.$store.dispatch('mySubmissions/restoreSubmissions', [props.submission._id]);
    };

    const handleExportJSON = () => {
      const dataString = JSON.stringify(props.submission, null, 2);
      downloadExternal(
        `data:text/plain;charset=utf-8,${encodeURIComponent(dataString)}`,
        `${props.submission._id}.json`
      );
    };

    const handleExportPDF = async () => {
      // Fetch survey
      let survey = null;
      const { id, version } = props.submission.meta.survey;
      survey = root.$store.getters['surveys/getSurvey'](id);
      if (!survey) {
        survey = await root.$store.dispatch('surveys/fetchSurvey', { id, version });
      }

      if (!survey) {
        console.log('Failed to fetch survey', id, version);
        return;
      }

      // Download PDF
      try {
        const res = await api.post(`/submissions/pdf?base64=1`, {
          survey,
          submission: {
            ...props.submission,
            meta: {
              ...props.submission.meta,
              creator: props.submission.meta.submitAsUser
                ? props.submission.meta.submitAsUser._id
                : props.submission.meta.creator,
            },
          },
        });

        if (res) {
          const disposition = parseDisposition(res.headers['content-disposition']);
          downloadExternal(res.data, disposition.parameters.filename);
        }
      } catch (e) {
        console.log('Failed to download PDF of submission', props.submission._id);
      }
    };

    const setFilerLocal = () => {
      root.$store.dispatch('myDrafts/setFilter', {
        local: true,
        remote: false,
      });
      root.$store.dispatch('myDrafts/fetchSurveys');
    };

    const setFilerServer = () => {
      root.$store.dispatch('myDrafts/setFilter', {
        local: false,
        remote: true,
      });
      root.$store.dispatch('myDrafts/fetchSurveys');
    };

    const setFilerCreator = () => {
      root.$store.dispatch('mySubmissions/setFilter', {
        resubmitter: false,
        proxyUserId: false,
        creator: true,
      });
      root.$store.dispatch('mySubmissions/fetchSurveys');
    };

    const setFilerProxy = () => {
      root.$store.dispatch('mySubmissions/setFilter', {
        resubmitter: false,
        proxyUserId: true,
        creator: false,
      });
      root.$store.dispatch('mySubmissions/fetchSurveys');
    };

    const setFilerResubmitter = () => {
      root.$store.dispatch('mySubmissions/setFilter', {
        resubmitter: true,
        proxyUserId: false,
        creator: false,
      });
      root.$store.dispatch('mySubmissions/fetchSurveys');
    };

    return {
      isOpen,
      isCreator,
      isProxied,
      isResubmitted,
      isArchived,
      isReadyToSubmit,
      isAdmin,
      dateSubmitted,
      dateModified,
      classes,
      survey,
      chipColor,
      resultItems,
      handleUploadDraft,
      handleDownloadDraft,
      handleSubmitDraft,
      handleSetGroup,
      handleArchiveSubmission,
      handleRestoreSubmission,
      handleExportJSON,
      handleExportPDF,
      setFilerLocal,
      setFilerServer,
      setFilerCreator,
      setFilerProxy,
      setFilerResubmitter,
    };
  },
};
</script>

<style lang="scss" scoped>
.draft-card {
  margin-top: 12px;
  border: 2px solid white;
  transition-property: box-shadow, border;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;

  &:not(.disabled) {
    cursor: pointer;
  }

  &.invalid {
    background: linear-gradient(0deg, rgba(222, 115, 146, 0.08), rgba(222, 115, 146, 0.08)), #ffffff;
    border-color: rgba(222, 115, 146, 0.08);
  }

  &.selected {
    box-shadow: none;
    border-color: var(--v-secondary-lighten2);

    .top .status-bar {
      left: 0px;
    }
  }

  & > .top,
  & > .bottom {
    padding: 8px 16px;
    position: relative;
    gap: 8px;
  }

  .top {
    .v-chip {
      transition-property: color, background-color;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }

    .status-bar {
      position: absolute;
      width: 4px;
      height: 56px;
      left: -2px;
      top: 50%;
      border-radius: 4px;
      transform: translateY(-50%);
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }

    .spacer + .d-flex {
      gap: 8px;
    }
  }

  .bottom {
    & > .d-flex {
      gap: 8px;
    }

    .v-divider {
      height: 16px;
      align-self: center;
    }
  }
}

.action-menu {
  min-width: 140px;
}
</style>
