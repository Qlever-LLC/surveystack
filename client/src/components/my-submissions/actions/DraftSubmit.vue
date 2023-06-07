<template>
  <v-btn
    color="primary"
    elevation="0"
    rounded
    small
    :outlined="!primary"
    :disabled="!!loading"
    :loading="isSubmitting"
    @click.stop="handleSubmit"
  >
    <v-icon left small>{{ primary ? 'mdi-cloud-upload' : 'mdi-cloud-upload-outline' }}</v-icon>
    Submit
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
    const isSubmitting = computed(() => loading.value === SubmissionLoadingActions.SUBMIT_DRAFT);

    const handleSubmit = () => {
      root.$store.dispatch('submissions/submitDrafts', [props.submission]);
    };

    return {
      loading,
      isSubmitting,
      handleSubmit,
    };
  },
});
</script>
