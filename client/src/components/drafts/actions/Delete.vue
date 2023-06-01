<template>
  <v-dialog v-model="isOpen" max-width="400">
    <template v-slot:activator="{ on, attrs }">
      <slot name="activator" :on="on" :attrs="attrs"></slot>
    </template>

    <v-card class="d-flex flex-column">
      <v-card-title>{{ isDraft ? 'Delete Draft' : 'Archive Submission' }}</v-card-title>

      <v-card-text class="pt-0">
        {{
          `The draft will be deleted permanently from ${
            isDraft ? 'your device' : 'the server'
          } and you will no longer be able to recover it.\nAre you sure you want to ${isDraft ? 'delete' : 'archive'}?`
        }}
      </v-card-text>

      <v-spacer></v-spacer>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text :disabled="!!loading" @click.stop="isOpen = false"> Cancel </v-btn>
        <v-btn text color="red" :loading="isDeleting" @click.stop="handleDelete">
          {{ isDraft ? 'Delete' : 'Archive' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
  },
  setup(props, { root }) {
    const isOpen = ref(false);
    const isDraft = computed(() => props.submission.options.draft);
    const loading = computed(() => root.$store.getters['submissions/getLoading'](props.submission._id));
    const isDeleting = computed(() => loading.value === SubmissionLoadingActions.DELETE);

    const handleDelete = async () => {
      root.$store.dispatch('submissions/delete', props.submission._id);
    };

    return {
      isOpen,
      isDraft,
      loading,
      isDeleting,
      handleDelete,
    };
  },
});
</script>
