<template>
  <v-dialog v-model="isOpen" max-width="400">
    <v-card class="d-flex flex-column">
      <v-card-title> Delete Submission </v-card-title>
      <v-card-text class="pt-0"> This action cannot be undone. Are you sure you want to delete? </v-card-text>
      <v-spacer></v-spacer>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click.stop="isOpen = false"> Cancel </v-btn>
        <v-btn text color="red" @click.stop="deleteSubmission"> Delete </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { computed, defineComponent } from '@vue/composition-api';
import { useSubmissionAction } from '@/store/modules/submissions.store';

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
    const { deleteSubmission } = useSubmissionAction(root.$store, props.submission);

    return {
      isOpen,
      deleteSubmission,
    };
  },
});
</script>
