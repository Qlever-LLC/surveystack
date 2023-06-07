<template>
  <div class="question question-script">
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <app-control-hint :value="control.hint" />

    <app-dialog
      :maxWidth="600"
      labelConfirm="Close"
      :hideCancel="true"
      v-model="showAndroidInstallDialog"
      v-bind="dialogProps"
      @cancel="showAndroidInstallDialog = false"
      @confirm="showAndroidInstallDialog = false"
    >
      <template v-slot:title>Installing Android App</template>
      <template>
        <p class="text--primary">
          Installing the Android Application allows to connect to Bluetooth and USB Devices for taking measurements.

          <br /><br />
          When installing you will be asked to allow installing applications from unknown sources.
        </p>

        <v-alert outlined class="pa-4" type="success" color="blue">
          If you have already installed the Android App once, you don't need install the App again.
        </v-alert>

        <br />
        <v-btn
          x-large
          color="green"
          href="https://gitlab.com/our-sci/software/surveystack-kit/-/jobs/artifacts/master/raw/app/build/outputs/apk/debug/app-debug.apk?job=assembleDebug"
          outlined
        >
          <v-icon left class="mr-4" x-large>mdi-android</v-icon>
          Download APK
        </v-btn>
      </template>
    </app-dialog>

    <a ref="scriptLink" :href="`surveystack://kit/${scriptId}`" style="display: none">Run Surveystack Script</a>

    <div v-if="this.source">
      <iframe src="" frameborder="0" ref="iframe" sandbox="allow-scripts allow-same-origin allow-popups" />

      <div class="android-button-container" v-if="!this.value">
        <v-btn
          v-if="control.options.isNativeScript"
          class=""
          x-large
          color="green"
          outlined
          @click="showAndroidInstallDialog = true"
        >
          <v-icon left class="mr-4" x-large>mdi-android</v-icon>
          Install Android App
        </v-btn>
      </div>

      <v-btn @click="requestRunScript" class="full center-button mt-4" depressed large color="primary">
        {{ control.options.buttonLabel ? control.options.buttonLabel : 'Run Script' }}
      </v-btn>
      <p class="status" v-if="meta.status || meta.statusMessage">
        <v-chip dark> {{ meta && meta.status }}</v-chip>
        <br />
        <v-chip dark class="mt-1">
          <v-icon small left>mdi-message-bulleted</v-icon>
          {{ meta && meta.statusMessage }}</v-chip
        >
      </p>
    </div>
    <div v-else-if="isLoading" class="d-flex align-center justify-center">
      <v-progress-circular indeterminate color="primary" class="ma-5" />
    </div>
    <div v-else-if="loadingSourceFailed" class="text-center">
      <v-icon color="red">mdi-close-thick</v-icon>
      There was an error loading the script.
    </div>
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import buildScriptQuestionIframeContents, { onMessage } from '@/utils/userScript';
import api from '@/services/api.service';
import BaseQuestionComponent from './BaseQuestionComponent';
import appDialog from '@/components/ui/Dialog.vue';
import { get } from 'lodash';
import { getParentPath } from '@/utils/surveyStack';

export default {
  mixins: [BaseQuestionComponent],
  components: {
    appDialog,
  },
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
    parent() {
      const parentPath = getParentPath(this.$vnode.key);
      const parentData = get(this.submission, parentPath);
      return parentData;
    },
  },
  data() {
    return {
      source: null,
      messageEventListeners: [],
      isLoading: false,
      loadingSourceFailed: false,
      scriptId: '',
      showAndroidInstallDialog: false,
    };
  },
  methods: {
    requestRunScript() {
      this.$refs.iframe.contentWindow.postMessage(
        {
          type: 'REQUEST_RUN_SCRIPT',
          payload: {
            value: this.value,
            context: this.meta.context || {},
            status: this.status || { type: null, message: null },
          },
        },
        '*'
      );
    },
    requestRenderScript() {
      this.$refs.iframe.contentWindow.postMessage(
        {
          type: 'REQUEST_RENDER_SCRIPT',
          payload: {
            value: this.value,
            context: this.meta.context || {},
          },
        },
        '*'
      );
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
    requestRunSurveyStackKit({ script }) {
      console.log('running script', script);
      this.scriptId = script;
      this.$refs.scriptLink.href = `surveystack://kit/${script}`;
      this.$refs.scriptLink.click();
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
    handleRequestResource({ resourceKey }) {
      console.log('script requested resource with key ', resourceKey);
      const resource = this.$store.getters['resources/getResourceByKey'](resourceKey);
      const file = resource.fileData;

      this.$refs.iframe.contentWindow.postMessage(
        {
          type: 'RETURN_RESOURCE',
          payload: {
            resourceKey,
            file,
          },
        },
        '*'
      );
    },
    initializeIframe() {
      const { iframe } = this.$refs;
      const submissionJSON = JSON.stringify(this.submission);
      const parentJSON = JSON.stringify(this.parent);
      const valueJSON = JSON.stringify(this.value);
      const contextJSON = JSON.stringify(this.meta.context || {});
      const controlJSON = JSON.stringify(this.control);
      const paramsJSON = JSON.stringify((this.control.options && this.control.options.params) || {});

      const html = buildScriptQuestionIframeContents({
        scriptSource: this.source.content,
        submissionJSON,
        parentJSON,
        valueJSON,
        contextJSON,
        controlJSON,
        paramsJSON,
      });
      iframe.src = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    },
    initializeEventListeners() {
      // onMessage returns the message listener function so that the listener can be removed on destroyed lifecycle method
      this.messageEventListeners.push(
        onMessage('SCRIPT_HAS_LOADED', this.handleScriptHasLoaded),
        onMessage('REQUEST_SET_QUESTION_VALUE', this.handleRequestSetQuestionValue),
        onMessage('REQUEST_SET_QUESTION_STATUS', this.handleRequestSetQuestionStatus),
        onMessage('REQUEST_LOG_MESSAGE', this.handleRequestLogMessage),
        onMessage('REQUEST_RUN_SURVEY_STACK_KIT', this.requestRunSurveyStackKit),
        onMessage('REQUEST_SET_QUESTION_CONTEXT', this.handleRequestSetContext),
        onMessage('REQUEST_SET_QUESTION_RENDER_QUEUE', this.handleRequestSetRenderQueue),
        onMessage('REQUEST_SET_QUESTION_RENDER_QUEUE', this.handleRequestSetRenderQueue),
        onMessage('REQUEST_RESOURCE', this.handleRequestResource)
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
      this.initializeEventListeners();
      this.isLoading = false;
    } catch (err) {
      console.log('Could not get script source', err);
      this.isLoading = false;
      this.loadingSourceFailed = true;
    }
  },
  destroyed() {
    this.messageEventListeners.forEach((handler) => window.removeEventListener('message', handler));
  },
};
</script>

<style scoped>
iframe {
  width: 100%;
  display: block;
  height: 40vh;
}

.center-button {
  margin-left: auto;
  margin-right: auto;
  display: block;
}

.question-script {
  width: 100%;
}

.android-button-container {
  display: flex;
  justify-content: center;
  width: 100%;
}
</style>
