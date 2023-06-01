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

      <span v-if="isArchived" class="grey--text"> {{ submission.meta.archivedReason }}</span>

      <template v-else-if="isDraft">
        <continue v-if="!isReadyToSubmit" :submission="submission"></continue>
        <submit v-if="isReadyToSubmit" :submission="submission"></submit>
        <upload v-if="isLocal" :submission="submission"> </upload>
        <download v-if="!isLocal" :submission="submission"></download>
        <delete :submission="submission"></delete>
      </template>

      <template v-else-if="isCreator || isAdmin">
        <resubmit :submission="submission"></resubmit>
        <archive :submission="submission"></archive>
      </template>
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
  </v-card>
</template>

<script>
import * as dateFns from 'date-fns';
import { computed } from '@vue/composition-api';
import Download from './actions/Download.vue';
import Upload from './actions/Upload.vue';
import Delete from './actions/Delete.vue';
import Archive from './actions/Archive.vue';
import Continue from './actions/Continue.vue';
import Submit from './actions/Submit.vue';
import Resubmit from './actions/Resubmit.vue';
import StatusChip from './StatusChip.vue';

const formatDate = (date) => {
  const parsedDate = dateFns.parseISO(date);
  return dateFns.isValid(parsedDate) ? dateFns.format(parsedDate, 'MMM d, yyyy h:mm a') : '';
};

export default {
  components: {
    Download,
    Upload,
    Delete,
    Archive,
    Continue,
    Submit,
    Resubmit,
    StatusChip,
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
    const dateSubmitted = computed(() => formatDate(props.submission.meta.dateSubmitted));
    const dateModified = computed(() => formatDate(props.submission.meta.dateModified));
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
        surveyName.push('blue-grey--text text--lighten-2 font-weight-light');
      } else if (isDraft.value) {
        surveyName.push('blue--text text--darken-2');
      } else if (isProxy.value) {
        surveyName.push('yellow--text text--darken-3');
      } else if (isCreator.value) {
        surveyName.push('green--text text--darken-2');
      }

      return {
        bar,
        surveyName,
      };
    });

    return {
      classes,
      survey,
      chipColor,
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
