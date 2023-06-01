<template>
  <v-chip v-if="label" :color="color" :input-value="true" small @click.stop="handleClick">
    {{ label }}
  </v-chip>
</template>

<script>
import { SubmissionTypes } from '@/store/modules/submissions.store';
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    color: String,
    label: String,
  },
  setup(props, { root }) {
    const handleClick = () => {
      let type = null;

      switch (props.label) {
        case 'Local': {
          type = [SubmissionTypes.LOCAL_DRAFTS];
          break;
        }

        case 'Server': {
          type = [
            SubmissionTypes.SERVER_DRAFTS,
            SubmissionTypes.SUBMITTED,
            SubmissionTypes.SUBMITTED_AS_PROXY,
            SubmissionTypes.RESUBMITTED,
          ];
          break;
        }

        case 'Draft': {
          type = [SubmissionTypes.LOCAL_DRAFTS, SubmissionTypes.SERVER_DRAFTS];
          break;
        }

        case 'Creator': {
          type = [SubmissionTypes.SUBMITTED];
          break;
        }

        case 'Proxy': {
          type = [SubmissionTypes.SUBMITTED_AS_PROXY];
          break;
        }

        case 'Resubmitter': {
          type = [SubmissionTypes.RESUBMITTED];
          break;
        }
      }

      if (type) {
        root.$store.dispatch('submissions/setFilter', { type });
      }
    };

    return {
      handleClick,
    };
  },
});
</script>
