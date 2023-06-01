<template>
  <v-btn
    color="primary"
    elevation="0"
    rounded
    small
    :disabled="!!loading"
    :loading="isSubmitting"
    @click.stop="handleSubmit"
  >
    <v-icon left small>mdi-check-bold</v-icon>
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
  },
  setup(props, { root }) {
    const loading = computed(() => root.$store.getters['submissions/getLoading'](props.submission._id));
    const isSubmitting = computed(() => loading.value === SubmissionLoadingActions.DELETE);

    const handleSubmit = () => {
      //
    };

    return {
      loading,
      isSubmitting,
      handleSubmit,
    };
  },
});
</script>
