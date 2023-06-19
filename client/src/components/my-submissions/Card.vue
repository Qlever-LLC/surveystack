<template>
  <v-card
    class="draft-card"
    :class="{
      selected: submission.options.selected,
      invalid: !survey || isArchived,
      disabled: !!loading,
    }"
    @click.native="handleSelect"
  >
    <div class="top">
      <div v-if="!isArchived" class="status-bar" :class="classes.bar"></div>
      <div class="d-flex flex-column align-start">
        <v-chip :color="chipColor" :input-value="true" label small @click.stop>
          {{ submission._id }}
        </v-chip>
        <div class="mt-2 d-flex align-center text-h6" :class="classes.surveyName">
          <v-icon v-if="!survey" class="mr-1" small>mdi-alert-outline</v-icon>
          {{ survey ? survey.name : 'No survey found' }}
        </div>
      </div>

      <v-spacer></v-spacer>

      <template v-if="isDraft">
        <draft-submit
          v-if="isReadyToSubmit"
          :submission="submission"
          primary
          @click="$emit('submit-draft', submission)"
        ></draft-submit>
        <draft-continue :submission="submission" :primary="!isReadyToSubmit"></draft-continue>
      </template>
      <template v-else>
        <span v-if="isArchived" class="mr-4 grey--text font-weight-light body-2">
          {{ submission.meta.archivedReason }}
        </span>
        <submission-resubmit v-if="isCreator || isAdmin" :submission="submission"></submission-resubmit>
      </template>

      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" rounded small icon text outlined v-on="on">
            <v-icon small>mdi-dots-horizontal</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item v-if="isDraft && isLocal" @click="uploadDraft()">
            <v-list-item-title>Upload</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="isDraft && !isLocal" @click="downloadDraft()">
            <v-list-item-title>Download</v-list-item-title>
          </v-list-item>
          <v-list-item @click="exportJSON()">
            <v-list-item-title>Export as JSON</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="isDraft" @click="isOpen.deleteDraft = true">
            <v-list-item-title class="red--text">Delete</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="!isDraft && (isCreator || isAdmin) && isArchived" @click="isOpen.deleteSubmission = true">
            <v-list-item-title class="red--text">Delete</v-list-item-title>
          </v-list-item>
          <v-list-item
            v-if="!isDraft && (isCreator || isAdmin) && !isArchived"
            @click="isOpen.archiveSubmission = true"
          >
            <v-list-item-title class="red--text">Archive</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <v-divider></v-divider>

    <div class="bottom">
      <status-chip v-if="isLocal" label="Local"></status-chip>
      <status-chip v-else label="Server"></status-chip>
      <status-chip v-if="isDraft" label="Draft" color="light-blue lighten-4"></status-chip>
      <template v-else>
        <status-chip v-if="isCreator" label="Creator" color="light-green lighten-4"></status-chip>
        <status-chip v-if="isProxy" label="Proxy" color="yellow lighten-4"></status-chip>
        <status-chip v-if="isResubmitter" label="Resubmitter" color="brown lighten-4"></status-chip>
      </template>

      <v-spacer></v-spacer>

      <span v-if="dateSubmitted" class="text-caption">
        <span class="blue-grey--text">Submitted:</span>
        {{ dateSubmitted }}
      </span>
      <v-divider v-if="dateSubmitted && dateModified" vertical></v-divider>
      <span v-if="dateModified" class="text-caption">
        <span class="blue-grey--text">Modified:</span>
        {{ dateModified }}
      </span>
    </div>

    <v-overlay :value="!!loading" absolute>
      <div class="loading">
        <p class="mb-2 text-center">{{ loading }}</p>
        <v-progress-linear indeterminate color="white"></v-progress-linear>
      </div>
    </v-overlay>

    <draft-delete v-model="isOpen.deleteDraft" :submission="submission"></draft-delete>
    <submission-delete v-model="isOpen.deleteSubmission" :submission="submission"></submission-delete>
    <submission-archive-dialog
      v-model="isOpen.archiveSubmission"
      maxWidth="50rem"
      labelConfirm="Archive"
      @cancel="isOpen.archiveSubmission = false"
      @confirm="archiveSubmission"
    >
      <template #title>Archive Submission</template>
    </submission-archive-dialog>
  </v-card>
</template>

<script>
import { computed, reactive } from '@vue/composition-api';
import SubmissionArchiveDialog from '@/components/survey/drafts/SubmissionArchiveDialog.vue';
import DraftContinue from './actions/DraftContinue.vue';
import DraftDelete from './actions/DraftDelete.vue';
import DraftSubmit from './actions/DraftSubmit.vue';
import SubmissionDelete from './actions/SubmissionDelete.vue';
import SubmissionResubmit from './actions/SubmissionResubmit.vue';
import StatusChip from './StatusChip.vue';
import { useSubmissionAction } from '@/store/modules/submissions.store';

export default {
  components: {
    DraftDelete,
    DraftContinue,
    DraftSubmit,
    SubmissionDelete,
    SubmissionResubmit,
    SubmissionArchiveDialog,
    StatusChip,
  },
  props: {
    submission: {
      type: Object,
      required: true,
    },
  },
  emits: ['submit-draft'],
  setup(props, { root }) {
    const { loading, uploadDraft, downloadDraft, archiveSubmission, exportJSON } = useSubmissionAction(
      root.$store,
      props.submission
    );
    const isOpen = reactive({
      deleteDraft: false,
      deleteSubmission: false,
      archiveSubmission: false,
    });
    const userId = computed(() => root.$store.getters['auth/user']._id);
    const chipColor = computed(() => (props.submission.options.selected ? 'secondary' : undefined));
    const isLocal = computed(() => props.submission.options.local);
    const isDraft = computed(() => props.submission.options.draft);
    const isCreator = computed(() => props.submission.meta.creator === userId.value);
    const isProxy = computed(() => props.submission.meta.proxyUserId === userId.value);
    const isResubmitter = computed(() => props.submission.meta.resubmitter === userId.value);
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
    const survey = computed(() =>
      root.$store.getters['submissions/surveys'].find((item) => item._id === props.submission.meta.survey.id)
    );

    const classes = computed(() => {
      const bar = [];
      if (isDraft.value) {
        bar.push('light-blue darken-3');
      } else if (isProxy.value) {
        bar.push('yellow darken-1');
      } else if (isCreator.value) {
        bar.push('green darken-1');
      }

      const surveyName = [];
      if (!survey.value || isArchived.value) {
        surveyName.push('blue-grey--text font-weight-light');
      } else if (isDraft.value) {
        surveyName.push('blue--text text--darken-3 font-weight-medium');
      } else if (isProxy.value) {
        surveyName.push('yellow--text text--darken-3 font-weight-medium');
      } else if (isCreator.value) {
        surveyName.push('green--text text--darken-3 font-weight-medium');
      }

      return {
        bar,
        surveyName,
      };
    });

    const handleSelect = () => {
      if (loading.value) {
        return;
      }

      root.$store.dispatch('submissions/setMySubmission', {
        submission: props.submission,
        newSubmission: {
          ...props.submission,
          options: {
            ...props.submission.options,
            selected: !props.submission.options.selected,
          },
        },
      });
    };

    return {
      classes,
      survey,
      chipColor,
      isOpen,
      isLocal,
      isDraft,
      isCreator,
      isProxy,
      isResubmitter,
      isArchived,
      isReadyToSubmit,
      isAdmin,
      dateSubmitted,
      dateModified,
      loading,
      uploadDraft,
      downloadDraft,
      archiveSubmission,
      exportJSON,
      handleSelect,
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

  &:hover .top {
    .status-bar {
      opacity: 1;
    }
    .spacer + .v-btn {
      display: block;
    }
  }

  & > .top,
  & > .bottom {
    padding: 8px 16px;
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &:not(.disabled):hover .top .status-bar {
    opacity: 1;
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
      opacity: 0;
      transform: translateY(-50%);
      transition-property: opacity, left;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }
  }

  .bottom .v-divider {
    height: 16px;
    align-self: center;
  }

  .v-overlay .loading {
    width: 240px;
  }
}

.action-menu {
  min-width: 140px;
}
</style>
