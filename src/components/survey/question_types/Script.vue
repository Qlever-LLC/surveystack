<template>
  <div class="question question-script">
    <iframe src="" frameborder="0" ref="iframe"></iframe>
  </div>
</template>

<script>
import BaseQuestionComponent from './BaseQuestionComponent';
import buildScriptQuestionIframeContents, { exampleScript, onMessage } from '@/utils/userScript';


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
  },
};

</script>

<style>

</style>
