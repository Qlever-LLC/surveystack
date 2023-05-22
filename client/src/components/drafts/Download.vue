<template>
  <v-btn
    color="primary"
    :disabled="Boolean(disabled)"
    :loading="isLoading"
    outlined
    rounded
    small
    @click.stop="handleClick"
  >
    <v-icon left small>mdi-cloud-download-outline</v-icon>
    Download
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
  },
  setup(props, { root }) {
    const loading = computed(() => root.$store.getters['submissions/getLoading'](props.submission._id));
    const isLoading = computed(() => loading.value === SubmissionLoadingActions.SAVE_TO_LOCAL);

    const handleClick = () => {
      root.$store.dispatch('submissions/saveToLocal', props.submission);
    };

    return {
      disabled: loading,
      isLoading,
      handleClick,
    };
  },
});
</script>
