<template>
  <div class="question question-script">
    <p class="mb-4">{{ control.hint }}</p>
    <div v-if="this.source">
      <iframe
        src=""
        frameborder="0"
        ref="iframe"
        sandbox="allow-scripts"
      />
      <v-btn
        @click="requestRunScript"
        class="full run-button"
        depressed
        large
        color="primary"
      >
        Run Script
      </v-btn>
      <p class="status">
        status: {{ meta && meta.status }}
        <br/>
        status message: {{ meta && meta.statusMessage }}
      </p>
    </div>
    <div v-else-if="isLoading" class="d-flex align-center justify-center">
      <v-progress-circular
        indeterminate
        color="primary"
        class="ma-5"
      />
    </div>
    <div v-else-if="loadingSourceFailed" class="text-center">
      <v-icon color="red">mdi-close-thick</v-icon>
      There was an error loading the script.
    </div>

  </div>
</template>

<script>
import buildScriptQuestionIframeContents, { onMessage } from '@/utils/userScript';
import api from '@/services/api.service';
import BaseQuestionComponent from './BaseQuestionComponent';

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
      messageEventListeners: [],
      isLoading: false,
      loadingSourceFailed: false,
    };
  },
  methods: {
    requestRunScript() {
      this.$refs.iframe.contentWindow.postMessage({
        type: 'REQUEST_RUN_SCRIPT',
        payload: {
          value: this.value,
          context: this.meta.context || {},
          status: this.status || { type: null, message: null },
        },
      }, '*');
    },
    requestRenderScript() {
      this.$refs.iframe.contentWindow.postMessage({
        type: 'REQUEST_RENDER_SCRIPT',
        payload: {
          value: this.value,
          context: this.meta.context || {},
        },
      }, '*');
    },
    handleScriptHasLoaded() {
      if (this.value) {
        this.requestRenderScript();
      }
    },
    handleRequestSetQuestionValue({ value }) {
      this.changed(value);
    },
    handleRequestSetQuestionStatus({ type, message }) {
      this.$emit('setStatus', { type, message });
    },
    handleRequestLogMessage({ messages }) {
      console.log(...messages);
    },
    handleRequestSetContext({ context }) {
      // TODO: ensure `context` is sanitized
      this.$emit('setContext', context);
    },
    handleRequestSetRenderQueue({ queue }) {
      // TODO: ensure `context` is sanitized
      console.log('set render queue', queue);
      this.$emit('setRenderQueue', queue);
    },
    initializeIframe() {
      const { iframe } = this.$refs;
      const submissionJSON = JSON.stringify(this.submission);
      const valueJSON = JSON.stringify(this.value);
      const contextJSON = JSON.stringify(this.meta.context || {});
      const controlJSON = JSON.stringify(this.control);
      const paramsJSON = JSON.stringify((this.control.options && this.control.options.params) || {});

      const html = buildScriptQuestionIframeContents({
        scriptSource: this.source.content,
        submissionJSON,
        valueJSON,
        contextJSON,
        controlJSON,
        paramsJSON,
      });
      iframe.src = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

      // onMessage returns the message listener function so that the listener can be removed on destroyed lifecycle method
      this.messageEventListeners.push(
        onMessage('SCRIPT_HAS_LOADED', this.handleScriptHasLoaded),
        onMessage('REQUEST_SET_QUESTION_VALUE', this.handleRequestSetQuestionValue),
        onMessage('REQUEST_SET_QUESTION_STATUS', this.handleRequestSetQuestionStatus),
        onMessage('REQUEST_LOG_MESSAGE', this.handleRequestLogMessage),
        onMessage('REQUEST_SET_QUESTION_CONTEXT', this.handleRequestSetContext),
        onMessage('REQUEST_SET_QUESTION_RENDER_QUEUE', this.handleRequestSetRenderQueue),
      );
    },
    async fetchScriptSource() {
      const sourceId = this.control && this.control.options && this.control.options.source;
      const { data } = await api.get(`/scripts/${sourceId}`);
      this.source = data;
    },
  },
  async mounted() {
    try {
      this.isLoading = true;
      await this.fetchScriptSource();
      this.initializeIframe();
      this.isLoading = false;
    } catch (err) {
      console.log('Could not get script source', err);
      this.isLoading = false;
      this.loadingSourceFailed = true;
    }
  },
  destroyed() {
    this.messageEventListeners.forEach(handler => window.removeEventListener('message', handler));
  },
};

</script>

<style scoped>
iframe {
  width: 100%;
  display: block;
  height: 50vh;
}

.status {

}

.run-button {
  margin-left: auto;
  margin-right: auto;
  display: block;
}

.question-script {
  width: 100%;
}
</style>
