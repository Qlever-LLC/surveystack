<template>
  <div class="question question-script">
    <iframe src="" frameborder="0" ref="iframe"></iframe>
    <v-btn
      @click="requestRunScript"
      class="full"
      depressed
      large
      color="primary"
    >
      Run Script
    </v-btn>
  </div>
</template>

<script>
import BaseQuestionComponent from './BaseQuestionComponent';
import buildScriptQuestionIframeContents, { exampleScript, onMessage } from '@/utils/userScript';
// import { onMessage } from '../../../../public/iframeMessaging';

export default {
  mixins: [BaseQuestionComponent],
  props: {
    submission: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {};
  },
  methods: {
    requestRunScript() {
      this.$refs.iframe.contentWindow.postMessage({ type: 'REQUEST_RUN_SCRIPT', payload: { value: this.value } });
    },
    requestRenderScript() {
      this.$refs.iframe.contentWindow.postMessage({ type: 'REQUEST_RENDER_SCRIPT', payload: { value: this.value } });
    },
  },
  mounted() {
    const { iframe } = this.$refs;
    const submissionJSON = JSON.stringify(this.submission);
    const valueJSON = JSON.stringify(this.value);


    // iframe.src = 'http://localhost:8082/script.html';
    const html = buildScriptQuestionIframeContents({ script: exampleScript, submissionJSON, valueJSON });
    // iframe.src = `data:text/html;charset=utf-8,${encodeURI(html)}`;
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();

    onMessage('REQUEST_SET_QUESTION_VALUE', ({ value }) => this.changed(value));
    onMessage('SCRIPT_HAS_LOADED', () => {
      if (this.value) {
        this.requestRenderScript();
      }
    });
  },
};

</script>

<style>

</style>
