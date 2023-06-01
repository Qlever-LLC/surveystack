<template>
  <v-btn rounded small icon text outlined :disabled="!!loading" :loading="isUploading" @click="handleUpload">
    <v-icon small>mdi-upload-outline</v-icon>
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
    const isUploading = computed(() => loading.value === SubmissionLoadingActions.SAVE_TO_SERVER);

    const handleUpload = () => {
      root.$store.dispatch('submissions/saveToServer', props.submission);
    };

    return {
      loading,
      isUploading,
      handleUpload,
    };
  },
});
</script>
