<template>
  <v-dialog v-model="isOpen" :persistent="isLoading" max-width="400">
    <v-card class="d-flex flex-column">
      <v-card-title> Delete Draft </v-card-title>
      <v-alert v-if="!isLoading && error" type="error" class="ma-4 d-flex justify-center">
        {{ error }}
      </v-alert>
      <v-card-text class="pt-0"> This action cannot be undone. Are you sure you want to delete? </v-card-text>
      <v-spacer></v-spacer>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text :disabled="isLoading" @click.stop="isOpen = false"> Cancel </v-btn>
        <v-btn text color="red" :loading="isLoading" @click.stop="handleDelete"> Delete </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { computed, defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
    },
    submission: {
      type: Object,
      required: true,
    },
  },
  emit: ['input'],
  setup(props, { root, emit }) {
    const isOpen = computed({
      get() {
        return !!props.value;
      },
      set(val) {
        emit('input', val);
      },
    });
    const isLoading = ref(false);
    const error = ref('');

    const handleDelete = async () => {
      isLoading.value = true;
      error.value = '';
      const success = await root.$store.dispatch('submissions/deleteDrafts', [props.submission._id]);
      isLoading.value = false;

      if (success) {
        isOpen.value = false;
      } else {
        error.value = 'Something wrong while deleting the draft.';
      }
    };

    return {
      isLoading,
      isOpen,
      error,
      handleDelete,
    };
  },
});
</script>
