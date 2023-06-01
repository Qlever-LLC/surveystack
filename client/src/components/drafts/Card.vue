<template>
  <v-card
    class="draft-card"
    :class="{
      checked,
      invalid: !survey,
      archived: isArchived,
    }"
  >
    <div class="top">
      <div v-if="!isArchived" class="status-bar" :class="classes.bar"></div>
      <div class="d-flex flex-column align-start">
        <v-chip :color="chipColor" :input-value="true" label small @click.stop>
          {{ submission._id }}
        </v-chip>
        <div class="mt-2 d-flex align-center text-h6 font-weight-regular" :class="classes.surveyName">
          <v-icon v-if="!survey" class="mr-1" small>mdi-alert-outline</v-icon>
          {{ survey ? survey.name : 'No survey found' }}
        </div>
      </div>

      <span class="ml-2">{{ submission.meta.status.map((i) => i.type).join(', ') }}</span>
      <v-spacer></v-spacer>

      <!-- Save to serer -->
      <span v-if="isArchived" class="grey--text"> {{ submission.meta.archivedReason }}</span>
      <template v-else>
        <!-- Continue draft -->
        <continue v-if="isDraft && !isReadyToSubmit" :submission="submission" />
        <submit v-if="isDraft && isReadyToSubmit" :submission="submission" />

        <!-- Resubmit submission -->
        <v-btn v-else color="primary" elevation="0" rounded small outlined>
          <v-icon left small>mdi-redo-variant</v-icon>
          Resubmit
        </v-btn>

        <v-btn
          v-if="isDraft && isLocal"
          color="primary"
          rounded
          small
          icon
          text
          outlined
          :disabled="!!loading"
          :loading="isUploading"
          @click="handleUpload"
        >
          <v-icon small>mdi-upload-outline</v-icon>
        </v-btn>

        <!-- Download to local -->
        <v-btn
          v-if="isDraft && !isLocal"
          rounded
          small
          icon
          text
          outlined
          :disabled="!!loading"
          :loading="isDownloading"
          @click="handleDownload"
        >
          <v-icon small>mdi-download-outline</v-icon>
        </v-btn>

        <!-- Delete/Archive -->
        <delete :submission="submission">
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              color="error"
              elevation="0"
              rounded
              small
              icon
              text
              outlined
              :disabled="!!loading"
              v-on="on"
            >
              <v-icon small>{{ isDraft ? 'mdi-delete-outline' : 'mdi-archive-outline' }}</v-icon>
            </v-btn>
          </template>
        </delete>
      </template>
    </div>

    <v-divider />

    <div class="bottom">
      <v-chip :input-value="true" small @click.stop="handleStatusChip(isLocal ? 'Local' : 'Server')">
        {{ isLocal ? 'Local' : 'Server' }}
      </v-chip>
      <v-chip
        v-if="isDraft"
        color="light-blue lighten-4"
        :input-value="true"
        small
        @click.stop="handleStatusChip('Draft')"
      >
        Draft
      </v-chip>
      <v-chip v-if="isProxy" color="yellow lighten-4" :input-value="true" small @click.stop="handleStatusChip('Proxy')">
        Proxy
      </v-chip>
      <v-chip v-else color="light-green lighten-4" :input-value="true" small @click.stop="handleStatusChip('Creator')">
        Creator
      </v-chip>
      <v-chip
        v-if="isResubmitted"
        color="brown lighten-4"
        :input-value="true"
        small
        @click.stop="handleStatusChip('Resubmitter')"
      >
        Resubmitter
      </v-chip>
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
  </v-card>
</template>

<script>
import { computed } from '@vue/composition-api';
import Delete from './actions/Delete.vue';
import Continue from './actions/Continue.vue';
import Submit from './actions/Submit.vue';
import * as dateFns from 'date-fns';
import { SubmissionLoadingActions, SubmissionTypes } from '@/store/modules/submissions.store';

const formatDate = (date) => {
  const parsedDate = dateFns.parseISO(date);
  return dateFns.isValid(parsedDate) ? dateFns.format(parsedDate, 'MMM d, yyyy h:mm a') : '';
};

export default {
  components: {
    Delete,
    Continue,
    Submit,
  },
  props: {
    submission: {
      type: Object,
      required: true,
    },
    checked: {
      type: Boolean,
    },
  },
  setup(props, { root }) {
    const userId = computed(() => root.$store.getters['auth/user']._id);
    const chipColor = computed(() => (props.checked ? 'secondary' : undefined));
    const isLocal = computed(() => props.submission.options.local);
    const isDraft = computed(() => props.submission.options.draft);
    const isProxy = computed(() => props.submission.meta.proxyUserId === userId.value);
    const isResubmitted = computed(() => props.submission.meta.resubmitter === userId.value);
    const isArchived = computed(() => !!props.submission.meta.archived);
    const isReadyToSubmit = computed(() =>
      props.submission.meta.status.some((item) => item.type === 'READY_TO_SUBMIT')
    );
    const dateSubmitted = computed(() => formatDate(props.submission.meta.dateSubmitted));
    const dateModified = computed(() => formatDate(props.submission.meta.dateModified));
    const survey = computed(() =>
      root.$store.getters['submissions/surveys'].find((item) => item._id === props.submission.meta.survey.id)
    );
    const loading = computed(() => root.$store.getters['submissions/getLoading'](props.submission._id));
    const isDownloading = computed(() => loading.value === SubmissionLoadingActions.SAVE_TO_LOCAL);
    const isUploading = computed(() => loading.value === SubmissionLoadingActions.SAVE_TO_SERVER);

    const classes = computed(() => {
      const bar = [];
      if (isDraft.value) {
        bar.push('light-blue darken-3');
      } else if (isProxy.value) {
        bar.push('yellow darken-1');
      } else {
        bar.push('green darken-1');
      }

      const surveyName = [];
      if (!survey.value || isArchived.value) {
        surveyName.push('blue-grey--text text--lighten-2 font-weight-light');
      } else if (isDraft.value) {
        surveyName.push('blue--text text--darken-2');
      } else if (isProxy.value) {
        surveyName.push('yellow--text text--darken-3');
      } else {
        surveyName.push('green--text text--darken-2');
      }

      return {
        bar,
        surveyName,
      };
    });

    const handleDownload = () => {
      root.$store.dispatch('submissions/saveToLocal', props.submission);
    };

    const handleUpload = () => {
      root.$store.dispatch('submissions/saveToServer', props.submission);
    };

    const handleStatusChip = (type) => {
      if (type === 'Local') {
        root.$store.dispatch('submissions/setFilter', {
          type: [SubmissionTypes.LOCAL_DRAFTS],
        });
      } else if (type === 'Server') {
        root.$store.dispatch('submissions/setFilter', {
          type: [
            SubmissionTypes.SERVER_DRAFTS,
            SubmissionTypes.SUBMITTED,
            SubmissionTypes.SUBMITTED_AS_PROXY,
            SubmissionTypes.RESUBMITTED,
          ],
        });
      } else if (type === 'Draft') {
        root.$store.dispatch('submissions/setFilter', {
          type: [SubmissionTypes.LOCAL_DRAFTS, SubmissionTypes.SERVER_DRAFTS],
        });
      } else if (type === 'Creator') {
        root.$store.dispatch('submissions/setFilter', {
          type: [SubmissionTypes.SUBMITTED],
        });
      } else if (type === 'Proxy') {
        root.$store.dispatch('submissions/setFilter', {
          type: [SubmissionTypes.SUBMITTED_AS_PROXY],
        });
      } else if (type === 'Resubmitter') {
        root.$store.dispatch('submissions/setFilter', {
          type: [SubmissionTypes.RESUBMITTED],
        });
      }
    };

    return {
      classes,
      survey,
      chipColor,
      isLocal,
      isDraft,
      isProxy,
      isResubmitted,
      isArchived,
      isReadyToSubmit,
      dateSubmitted,
      dateModified,
      loading,
      isDownloading,
      isUploading,
      handleDownload,
      handleUpload,
      handleStatusChip,
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

  &:not(.archived) {
    cursor: pointer;
  }

  &.invalid {
    background: linear-gradient(0deg, rgba(222, 115, 146, 0.08), rgba(222, 115, 146, 0.08)), #ffffff;
    border-color: rgba(222, 115, 146, 0.08);
  }

  &.checked {
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

  & > div {
    padding: 8px 16px;
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &:hover .top {
    .status-bar {
      opacity: 1;
    }
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

  .bottom {
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
