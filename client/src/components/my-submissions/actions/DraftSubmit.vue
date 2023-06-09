<template>
  <v-btn
    color="primary"
    elevation="0"
    rounded
    small
    :outlined="!primary"
    :disabled="!!loading"
    :loading="isDraftSubmitting"
    @click.stop="$emit('click')"
  >
    <v-icon left small>{{ primary ? 'mdi-cloud-upload' : 'mdi-cloud-upload-outline' }}</v-icon>
    Submit
  </v-btn>
</template>

<script>
import { computed, defineComponent } from '@vue/composition-api';
import { useSubmissionAction } from '@/store/modules/submissions.store';

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
    const submission = computed(() => props.submission);
    const { loading, isDraftSubmitting } = useSubmissionAction(root.$store, submission);

    return {
      loading,
      isDraftSubmitting,
    };
  },
});
</script>
