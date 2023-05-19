<template>
  <v-card
    class="draft-card"
    :class="{
      checked,
      invalid: invalidSurvey,
    }"
  >
    <div class="top">
      <div
        class="status-bar"
        :class="{
          'light-blue darken-3': isDraft,
          'green darken-3': !isDraft,
        }"
      ></div>
      <div class="d-flex flex-column align-start">
        <v-chip :color="chipColor" :input-value="true" label small>
          {{ submission._id }}
        </v-chip>
        <div
          class="text-subtitle-1 mt-2 d-flex align-center"
          :class="{
            'blue-grey--text text--lighten-3 font-weight-light': invalidSurvey,
            'green--text text--darken-3': !invalidSurvey && !isDraft,
            'light-blue--text text--darken-3': !invalidSurvey && isDraft,
          }"
        >
          <v-icon v-if="!surveyName" class="mr-1" small>mdi-alert-outline</v-icon>
          {{ surveyName || 'No survey found' }}
        </div>
      </div>
      <v-spacer></v-spacer>
      <v-btn v-if="isLocal" color="primary" outlined rounded small>
        <v-icon left small>mdi-cloud-upload-outline</v-icon> Save
      </v-btn>
      <v-btn v-if="isDraft && !invalidSurvey" color="primary" elevation="0" rounded small>
        <v-icon left small>mdi-play</v-icon> Continue
      </v-btn>
    </div>

    <v-divider />

    <div class="bottom">
      <span class="text-caption">
        <span class="blue-grey--text text--lighten-2">Status:</span>
        {{ isDraft ? 'Draft' : 'Submitted' }}
      </span>
      <v-divider vertical></v-divider>
      <span class="text-caption">
        <span class="blue-grey--text text--lighten-2">Location:</span>
        {{ isLocal ? 'Local' : 'Server' }}
      </span>
      <v-spacer></v-spacer>
      <span v-if="dateSubmitted" class="text-caption">
        <span class="blue-grey--text text--lighten-2">Submitted:</span>
        {{ dateSubmitted }}
      </span>
      <v-divider v-if="dateSubmitted && dateModified" vertical></v-divider>
      <span v-if="dateModified" class="text-caption">
        <span class="blue-grey--text text--lighten-2">Modified:</span>
        {{ dateModified }}
      </span>
    </div>
  </v-card>
</template>

<script>
import submission from '@/router/submission';
import { computed, ref } from '@vue/composition-api';
import * as dateFns from 'date-fns';

const formatDate = (date) => {
  const parsedDate = dateFns.parseISO(date);
  return dateFns.isValid(parsedDate) ? dateFns.format(parsedDate, 'MMM d, yyyy h:mm a') : '';
};

export default {
  props: {
    submission: {
      type: Object,
      required: true,
    },
    survey: {
      type: Object,
    },
    checked: {
      type: Boolean,
    },
  },
  setup(props) {
    const chipColor = computed(() => (props.checked ? 'secondary' : undefined));
    const surveyName = computed(() => (props.survey ? props.survey.name : undefined));
    const invalidSurvey = computed(() => !surveyName.value);
    const isDraft = computed(() => props.submission.draftOptions && !!props.submission.draftOptions.draft);
    const isLocal = computed(() => props.submission.draftOptions && !!props.submission.draftOptions.local);
    const dateSubmitted = computed(() => formatDate(props.submission.meta.dateSubmitted));
    const dateModified = computed(() => formatDate(props.submission.meta.dateModified));

    return {
      chipColor,
      surveyName,
      invalidSurvey,
      isDraft,
      isLocal,
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
  cursor: pointer;
  transition-property: box-shadow, border;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;

  &.invalid {
    background: linear-gradient(0deg, rgba(222, 115, 146, 0.08), rgba(222, 115, 146, 0.08)), #ffffff;
    border-color: rgba(222, 115, 146, 0.08);
  }

  &.checked {
    box-shadow: none;
    border: 2px solid var(--v-secondary-lighten2);
  }

  &:hover .top .status-bar {
    opacity: 1;
  }

  & > div {
    padding: 8px 16px;
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .top {
    .status-bar {
      position: absolute;
      width: 4px;
      height: 56px;
      left: 0;
      top: 50%;
      border-radius: 4px;
      transform: translateY(-50%);
      opacity: 0;
      transition-property: opacity;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }

    .v-chip {
      padding: 2px 6px;
      line-height: 12px;
      transition-property: color, background-color;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }
  }

  .bottom {
    .v-divider {
      height: 12px;
      align-self: center;
    }
  }
}
</style>
