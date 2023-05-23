<template>
  <v-list-item :disabled="Boolean(disabled)" @click="handleClick">
    <v-list-item-icon class="mr-4">
      <v-icon>mdi-cloud-download-outline</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title> Download </v-list-item-title>
    </v-list-item-content>
  </v-list-item>
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
