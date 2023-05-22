<template>
  <v-card class="draft-card" :class="{ checked, invalid: !survey }">
    <div class="top">
      <div
        class="status-bar"
        :class="{
          'light-blue darken-3': isDraft,
          'green darken-1': !isDraft,
        }"
      ></div>
      <div class="d-flex flex-column align-start">
        <v-chip :color="chipColor" :input-value="true" label small>
          {{ submission._id }}
        </v-chip>
        <div
          class="text-subtitle-1 mt-2 d-flex align-center"
          :class="{
            'blue-grey--text text--lighten-3 font-weight-light': !survey,
            'green--text text--darken-1': survey && !isDraft,
            'light-blue--text text--darken-3': survey && isDraft,
          }"
        >
          <v-icon v-if="!survey" class="mr-1" small>mdi-alert-outline</v-icon>
          {{ survey ? survey.name : 'No survey found' }}
        </div>
      </div>
      <v-spacer></v-spacer>
      <delete-btn :submission="submission"></delete-btn>
      <save-btn v-if="isDraft && isLocal" :submission="submission"></save-btn>
      <download-btn v-if="isDraft && !isLocal" :submission="submission"></download-btn>
      <v-btn v-if="isDraft" color="primary" elevation="0" rounded small>
        <v-icon left small>mdi-play</v-icon>
        Continue
      </v-btn>
      <v-btn v-if="!isDraft" color="primary" elevation="0" rounded small>
        <v-icon left small>mdi-redo-variant</v-icon>
        Resubmit
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
import { computed } from '@vue/composition-api';
import submission from '@/router/submission';
import SaveBtn from '@/components/drafts/Save.vue';
import DownloadBtn from '@/components/drafts/Download.vue';
import DeleteBtn from '@/components/drafts/Delete.vue';
import * as dateFns from 'date-fns';

const formatDate = (date) => {
  const parsedDate = dateFns.parseISO(date);
  return dateFns.isValid(parsedDate) ? dateFns.format(parsedDate, 'MMM d, yyyy h:mm a') : '';
};

export default {
  components: {
    SaveBtn,
    DownloadBtn,
    DeleteBtn,
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
    const chipColor = computed(() => (props.checked ? 'secondary' : undefined));
    const isDraft = computed(() => props.submission.options.draft);
    const isLocal = computed(() => props.submission.options.local);
    const dateSubmitted = computed(() => formatDate(props.submission.meta.dateSubmitted));
    const dateModified = computed(() => formatDate(props.submission.meta.dateModified));
    const survey = computed(() =>
      root.$store.getters['submissions/surveys'].find((item) => item._id === props.submission.meta.survey.id)
    );

    return {
      survey,
      chipColor,
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

    .spacer + div {
      gap: 8px;
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
