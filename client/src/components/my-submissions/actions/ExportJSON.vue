<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on, attrs }">
      <v-btn v-bind="attrs" rounded small icon text outlined :disabled="!!loading" v-on="on" @click.stop="exportJSON">
        <v-icon small>mdi-code-json</v-icon>
      </v-btn>
    </template>
    <span>Export JSON</span>
  </v-tooltip>
</template>

<script>
import { useSubmissionAction } from '@/store/modules/submissions.store';
import downloadExternal from '@/utils/downloadExternal';
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
    const { loading } = useSubmissionAction(root.$store, submission);

    const exportJSON = () => {
      const dataString = JSON.stringify(props.submission, null, 2);
      downloadExternal(
        `data:text/plain;charset=utf-8,${encodeURIComponent(dataString)}`,
        `${props.submission._id}.json`
      );
    };

    return {
      loading,
      exportJSON,
    };
  },
});
</script>
