<template>
  <v-btn color="primary" dark :disabled="disabled" @click="handleExport">
    Export JSON ({{ submissions.length }})
  </v-btn>
</template>

<script>
import downloadExternal from '@/utils/downloadExternal';
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    submissions: {
      type: Array,
      required: true,
    },
    disabled: { type: Boolean },
  },
  setup(props) {
    const handleExport = () => {
      props.submissions.forEach((submission) => {
        const dataString = JSON.stringify(submission, null, 2);
        downloadExternal(`data:text/plain;charset=utf-8,${encodeURIComponent(dataString)}`, `${submission._id}.json`);
      });
    };

    return {
      handleExport,
    };
  },
});
</script>
