<template>
  <v-btn v-bind="$attrs" :disabled="disabled" @click="handleExport">
    <slot> Export PDF ({{ submissions.length }}) </slot>
  </v-btn>
</template>

<script>
import { defineComponent, ref, watch } from '@vue/composition-api';
import downloadExternal from '@/utils/downloadExternal';
import api from '@/services/api.service';
import { parse as parseDisposition } from 'content-disposition';

export default defineComponent({
  props: {
    submissions: {
      type: Array,
      required: true,
    },
    disabled: { type: Boolean },
  },
  emits: ['loading-change', 'success'],
  setup(props, { root, emit }) {
    const isLoading = ref(false);

    const handleExport = async () => {
      isLoading.value = true;

      for (let i = 0; i < props.submissions.length; i++) {
        const submission = props.submissions[i];

        // Fetch survey
        let survey = null;
        const { id, version } = submission.meta.survey;
        survey = root.$store.getters['surveys/getSurvey'](id);
        if (!survey) {
          survey = await root.$store.dispatch('surveys/fetchSurvey', { id, version });
        }

        if (!survey) {
          console.log('Failed to fetch survey', id, version);
          continue;
        }

        // Download PDF
        try {
          const res = await api.post(`/submissions/pdf?base64=1`, {
            survey,
            submission: {
              ...submission,
              meta: {
                ...submission.meta,
                creator: submission.meta.submitAsUser ? submission.meta.submitAsUser._id : submission.meta.creator,
              },
            },
          });

          if (res) {
            const disposition = parseDisposition(res.headers['content-disposition']);
            downloadExternal(res.data, disposition.parameters.filename);
          }
        } catch (e) {
          console.log('Failed to download PDF of submission', props.submission._id);
        }
      }

      isLoading.value = false;
    };

    watch(isLoading, (val) => {
      emit('loading-change', val);
    });

    return {
      handleExport,
    };
  },
});
</script>
