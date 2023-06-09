<template>
  <v-dialog v-model="isOpen" max-width="400">
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        color="error"
        elevation="0"
        rounded
        small
        icon
        text
        outlined
        :disabled="!!loading"
        v-on="on"
      >
        <v-icon small>mdi-delete-outline</v-icon>
      </v-btn>
    </template>

    <v-card class="d-flex flex-column">
      <v-card-title> Delete Submission </v-card-title>

      <v-card-text class="pt-0"> This action cannot be undone. Are you sure you want to delete? </v-card-text>

      <v-spacer></v-spacer>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text :disabled="!!loading" @click.stop="isOpen = false"> Cancel </v-btn>
        <v-btn text color="red" :loading="isSubmissionDeleting" @click.stop="deleteSubmission"> Delete </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useSubmissionAction } from '@/store/modules/submissions.store';

export default defineComponent({
  props: {
    submission: {
      type: Object,
      required: true,
    },
  },
  setup(props, { root }) {
    const isOpen = ref(false);
    const submission = computed(() => props.submission);
    const { loading, isSubmissionDeleting, deleteSubmission } = useSubmissionAction(root.$store, submission);

    return {
      isOpen,
      loading,
      isSubmissionDeleting,
      deleteSubmission,
    };
  },
});
</script>
