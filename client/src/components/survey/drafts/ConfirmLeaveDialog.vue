<template>
  <v-dialog v-model="isOpen" persistent width="300">
    <v-card>
      <v-card-title> Exit Draft </v-card-title>
      <v-card-text>
        <p>Do you want to save this draft?</p>
        <v-radio-group v-model="action">
          <v-radio label="Save" value="server"></v-radio>
          <v-radio label="Keep Draft" value="local"></v-radio>
          <v-radio label="Discard changes" value="discard"></v-radio>
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text :disabled="!!loading" @click.stop="handleCancel"> Cancel </v-btn>
        <v-btn text color="primary" :loading="isLoading" @click.stop="handleExit"> Exit </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import api from '@/services/api.service';
import { SubmissionLoadingActions } from '@/store/modules/submissions.store';
import { computed, defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  props: {
    submission: {
      type: Object,
      required: true,
    },
  },
  setup(props, { root }) {
    const loading = computed(() => root.$store.getters['submissions/getLoading'](props.submission._id));
    const isLoading = computed(
      () =>
        loading.value === SubmissionLoadingActions.SAVE_TO_SERVER ||
        loading.value === SubmissionLoadingActions.DELETE_DRAFT
    );
    const isOpen = ref(false);
    const action = ref('server');
    const next = ref(null);

    const open = (callback) => {
      action.value = 'server';
      next.value = callback;
      isOpen.value = true;
    };

    const handleExit = async () => {
      // Remove proxy header
      api.removeHeader('x-delegate-to');

      // Save to server
      if (action.value === 'server') {
        await root.$store.dispatch('submissions/saveToServer', props.submission);
      } else if (action.value === 'discard') {
        await root.$store.dispatch('submissions/deleteDrafts', [props.submission._id]);
      }

      isOpen.value = false;
      if (typeof next.value === 'function') {
        next.value(true);
      }
    };

    const handleCancel = () => {
      isOpen.value = false;
      if (typeof next.value === 'function') {
        next.value(false);
      }
    };

    return {
      loading,
      isLoading,
      isOpen,
      action,
      open,
      handleExit,
      handleCancel,
    };
  },
});
</script>
