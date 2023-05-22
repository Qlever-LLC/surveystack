<template>
  <v-dialog v-model="isOpen" max-width="400">
    <template v-slot:activator="{ on, attrs }">
      <v-btn v-bind="attrs" color="error" :disabled="Boolean(disabled)" outlined rounded small v-on="on" @click.stop>
        <v-icon left small>mdi-delete-outline</v-icon>
        {{ submission.options.draft ? 'Delete' : 'Archive' }}
      </v-btn>
    </template>

    <v-card class="d-flex flex-column">
      <v-card-title>{{ submission.options.draft ? 'Delete Draft' : 'Archive Submission' }}</v-card-title>

      <v-card-text class="pt-0">
        {{
          `The draft will be deleted permanently from ${
            submission.options.draft ? 'your device' : 'the server'
          } and you will no longer be able to recover it.\nAre you sure you want to ${
            submission.options.draft ? 'delete' : 'archive'
          }?`
        }}
      </v-card-text>

      <v-spacer></v-spacer>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text :disabled="Boolean(disabled)" @click.stop="isOpen = false"> Cancel </v-btn>
        <v-btn text color="red" :loading="isLoading" @click.stop="handleClick">
          {{ submission.options.draft ? 'Delete' : 'Archive' }}
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
    const loading = computed(() => root.$store.getters['submissions/getLoading'](props.submission._id));
    const isLoading = computed(() => loading.value === SubmissionLoadingActions.DELETE);

    const handleClick = async () => {
      root.$store.dispatch('submissions/delete', props.submission._id);
    };

    return {
      isOpen,
      disabled: loading,
      isLoading,
      handleClick,
    };
  },
});
</script>
