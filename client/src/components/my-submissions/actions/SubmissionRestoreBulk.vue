<template>
  <v-btn
    v-if="submissions.length > 0"
    color="primary"
    dark
    :disabled="disabled"
    :loading="isLoading"
    @click="handleRestoreSubmissions"
  >
    Restore ({{ submissions.length }})
  </v-btn>
</template>

<script>
import { defineComponent, ref, watch } from '@vue/composition-api';

export default defineComponent({
  props: {
    submissions: {
      type: Array,
      required: true,
    },
    disabled: { type: Boolean },
  },
  emits: ['loading-change'],
  setup(props, { root, emit }) {
    const isOpen = ref(false);
    const isLoading = ref(false);

    const handleRestoreSubmissions = async () => {
      isOpen.value = false;
      isLoading.value = true;
      const ids = props.submissions.map((item) => item._id);
      const success = await root.$store.dispatch('submissions/restoreSubmissions', ids);
      isLoading.value = false;

      if (!success) {
        root.$store.dispatch(
          'feedback/add',
          `Something went wrong while restoring ${ids.length === 1 ? 'the submission' : ids.length + ' submissions'}.`
        );
      }
    };

    watch(isLoading, (val) => {
      emit('loading-change', val);
    });

    return {
      isOpen,
      isLoading,
      handleRestoreSubmissions,
    };
  },
});
</script>
