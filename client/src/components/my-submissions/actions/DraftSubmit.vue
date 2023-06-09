<template>
  <v-btn
    color="primary"
    elevation="0"
    rounded
    small
    :outlined="!primary"
    :disabled="!!loading"
    :loading="isSubmitting"
    @click.stop="$emit('click')"
  >
    <v-icon left small>{{ primary ? 'mdi-cloud-upload' : 'mdi-cloud-upload-outline' }}</v-icon>
    Submit
  </v-btn>
</template>

<script>
import { computed, defineComponent, ref } from '@vue/composition-api';
import { SubmissionLoadingActions } from '@/store/modules/submissions.store';

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
  emits: ['click'],
  setup(props, { root }) {
    const isOpen = ref(false);
    const loading = computed(() => root.$store.getters['submissions/getLoading'](props.submission._id));
    const isSubmitting = computed(() => loading.value === SubmissionLoadingActions.SUBMIT_DRAFT);

    return {
      isOpen,
      loading,
      isSubmitting,
    };
  },
});
</script>
