<template>
  <v-btn
    color="primary"
    elevation="0"
    rounded
    small
    :outlined="!primary"
    :disabled="!!loading"
    :loading="isSaving"
    @click.stop="handleClick"
  >
    <v-icon left small>mdi-redo-variant</v-icon>
    Resubmit
  </v-btn>
</template>

<script>
import { SubmissionLoadingActions } from '@/store/modules/submissions.store';
import { computed, defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    submission: {
      type: Object,
      required: true,
    },
    primary: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { root }) {
    const loading = computed(() => root.$store.getters['submissions/getLoading'](props.submission._id));
    const isSaving = computed(() => loading.value === SubmissionLoadingActions.SAVE_TO_LOCAL);

    const handleClick = async () => {
      // Create a new local draft from the submission
      await root.$store.dispatch('submissions/saveToLocal', props.submission);

      root.$router.push(`/submissions/drafts/${props.submission._id}`);
    };

    return {
      loading,
      isSaving,
      handleClick,
    };
  },
});
</script>
