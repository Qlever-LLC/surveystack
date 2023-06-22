<template>
  <v-dialog v-model="isOpen" persistent width="300">
    <v-card>
      <v-card-title> Exit Draft </v-card-title>
      <v-card-text>
        <p>Do you want to save this draft?</p>
        <v-radio-group v-model="action">
          <v-radio label="Save to server" value="server"></v-radio>
          <v-radio label="Keep draft on my local" value="local"></v-radio>
          <v-radio label="Discard changes" value="discard"></v-radio>
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text :disabled="isLoading" @click.stop="handleCancel"> Cancel </v-btn>
        <v-btn text color="primary" :loading="isLoading" @click.stop="handleExit"> Exit </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import api from '@/services/api.service';
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  props: {
    submission: {
      type: Object,
      required: true,
    },
  },
  setup(props, { root }) {
    const isLoading = ref(false);
    const isOpen = ref(false);
    const action = ref('server');
    const next = ref(null);

    const open = (callback) => {
      action.value = 'server';
      next.value = callback;
      isOpen.value = true;
    };

    const handleExit = async () => {
      isLoading.value = true;

      // Remove proxy header
      api.removeHeader('x-delegate-to');

      // Save to server
      if (action.value === 'server') {
        await root.$store.dispatch('myDrafts/saveRemoteDrafts', [props.submission]);
      } else if (action.value === 'discard') {
        await root.$store.dispatch('myDrafts/deleteDrafts', [props.submission._id]);
      }

      isLoading.value = false;
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
