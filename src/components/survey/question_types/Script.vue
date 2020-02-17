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
    status: {{ meta && meta.status }}
    status message: {{ meta && meta.statusMessage }}
  </div>
</template>

<script>
import BaseQuestionComponent from './BaseQuestionComponent';
import buildScriptQuestionIframeContents, { exampleScript, onMessage } from '@/utils/userScript';
// import { onMessage } from '../../../../public/iframeMessaging';
import api from '@/services/api.service';

export default {
  mixins: [BaseQuestionComponent],
  props: {
    submission: {
      type: Object,
      default: () => ({}),
    },
    meta: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    status() {
      return {
        type: this.meta.status,
        message: this.meta.statusMessage,
      };
    },
  },
  data() {
    return {
      source: null,
    };
  },
  methods: {
    requestRunScript() {
      this.$refs.iframe.contentWindow.postMessage({ type: 'REQUEST_RUN_SCRIPT', payload: { value: this.value } });
    },
    requestRenderScript() {
      this.$refs.iframe.contentWindow.postMessage({ type: 'REQUEST_RENDER_SCRIPT', payload: { value: this.value } });
    },
    // handleRequestSetStatus() {
    //   this.emit
    // },
    initializeIframe() {
      const { iframe } = this.$refs;
      const submissionJSON = JSON.stringify(this.submission);
      const valueJSON = JSON.stringify(this.value);


      // iframe.src = 'http://localhost:8082/script.html';
      const html = buildScriptQuestionIframeContents({ script: this.source.content, submissionJSON, valueJSON });
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
      onMessage('REQUEST_SET_QUESTION_STATUS', ({ type, message }) => this.$emit('setStatus', { type, message }));
    },
    async fetchScriptSource() {
      const sourceId = this.control && this.control.source;
      const { data } = await api.get(`/scripts/${sourceId}`);
      this.source = data;
    },
  },
  // async created() {
  // },
  async mounted() {
    await this.fetchScriptSource();
    this.initializeIframe();
  },
};

</script>

<style>

</style>
