<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        rounded
        small
        icon
        text
        outlined
        :disabled="!!loading"
        :loading="isDraftDownloading"
        v-on="on"
        @click.stop="downloadDraft"
      >
        <v-icon small>mdi-download-outline</v-icon>
      </v-btn>
    </template>
    <span>Download draft</span>
  </v-tooltip>
</template>

<script>
import { useSubmissionAction } from '@/store/modules/submissions.store';
import { computed, defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    submission: {
      type: Object,
      required: true,
    },
  },
  setup(props, { root }) {
    const submission = computed(() => props.submission);
    const { loading, isDraftDownloading, downloadDraft } = useSubmissionAction(root.$store, submission);

    return {
      loading,
      isDraftDownloading,
      downloadDraft,
    };
  },
});
</script>
