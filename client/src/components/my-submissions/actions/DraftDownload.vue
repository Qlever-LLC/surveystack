<template>
  <v-btn rounded small icon text outlined :disabled="!!loading" :loading="isDownloading" @click.stop="handleDownload">
    <v-icon small>mdi-download-outline</v-icon>
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
    const isDownloading = computed(() => loading.value === SubmissionLoadingActions.SAVE_TO_LOCAL);

    const handleDownload = () => {
      root.$store.dispatch('submissions/saveToLocal', props.submission);
    };

    return {
      loading,
      isDownloading,
      handleDownload,
    };
  },
});
</script>
