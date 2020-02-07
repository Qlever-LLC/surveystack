<template>
  <div
    class="screen-root"
    style="padding: 0px 12px 0px 0px !important"
  >
    <multipane
      style="padding: 0px !important"
      class="pane-root"
      layout="vertical"
    >
      <div class="pane pane-survey">
        <graphical-view
          class="graphical-view"
          v-if="!viewCode"
          :selected="control"
          :controls="currentControls"
          @controlSelected="controlSelected"
        />
      </div>
      <multipane-resizer />
      <div class="pane pane-controls">
        <v-card>
          <div class="sticky-top pa-4">
            <v-card-title>Details</v-card-title>
            <survey-details
              v-model="survey"
              :editMode="editMode"
              :dirty="dirty"
              @cancel="onCancel"
              @submit="onSubmit"
              @delete="onDelete"
            />
            <v-card-title>Add questions</v-card-title>
            <control-adder @controlAdded="controlAdded" />
            <v-card-title>Properties</v-card-title>
            <control-properties
              :hasRelevance="currentControlHasRelevance"
              :hasCalculate="currentControlHasCalculate"
              :toggleCode="toggleCodeEditor"
              :control="control"
              :survey="survey"
              @code-calculate="showMainCode = true"
            />
          </div>
        </v-card>
      </div>
      <multipane-resizer />
      <div
        class="pane pane-main-code"
        v-if="showMainCode"
      >

        <multipane
          layout="horizontal"
          class="code-resizer"
        >
          <code-editor
            @close="showMainCode = false"
            title="Relevance"
            :code="relevanceCode"
            v-if="survey"
            class="main-code-editor"
            :refresh="codeRefreshCounter"
            :runnable="true"
            :error="codeError"
            @run="runCode"
            :result="evaluated"
          ></code-editor>
          <multipane-resizer class="horizontal-line" />
          <console-log
            class="console-log"
            :log="log"
            @clear="log = ''"
          />
        </multipane>
      </div>
      <multipane-resizer v-if="showMainCode" />
      <div class="pane pane-submission-code">
        <div
          class="code-editor"
          :class="{ 'editor-visible': showCodeEditor, 'editor-hidden' : !showCodeEditor }"
        >
          <code-editor
            title="Survey Submission"
            v-if="survey"
            class="code-editor"
            readonly="true"
            :code="submissionCode"
          ></code-editor>
        </div>
      </div>
      <multipane-resizer />
      <div class="pane pane-draft">
        <draft
          v-if="survey && instance"
          :submission="instance"
          :survey="survey"
          @submissionChanged="refreshSubmission"
        ></draft>
      </div>

    </multipane>

    <app-dialog
      v-model="showDeleteModal"
      @cancel="showDeleteModal = false"
      @confirm="onDelete"
    >
      <template v-slot:title>Confirm your action</template>
      <template>
        Delete survey
        <strong>{{survey._id}}</strong>
        for sure?
      </template>
    </app-dialog>

    <app-dialog
      v-model="showConflictModal"
      @cancel="showConflictModal = false"
      @confirm="generateId"
    >
      <template v-slot:title>Conflict 409</template>
      <template>
        A survey with id
        <strong>{{survey._id}}</strong> already exists. Do you want to generate a different id?
      </template>
    </app-dialog>

    <v-snackbar
      v-model="showSnackbar"
      :timeout="0"
    >
      {{snackbarMessage | capitalize}}
      <v-btn
        color="pink"
        text
        @click="showSnackbar = false"
      >Close</v-btn>
    </v-snackbar>
  </div>
</template>

<script>
import _ from 'lodash';
import ObjectId from 'bson-objectid';

import { Multipane, MultipaneResizer } from 'vue-multipane';

import api from '@/services/api.service';

import codeEditor from '@/components/ui/CodeEditor.vue';
import graphicalView from '@/components/builder/GraphicalView.vue';
import controlProperties from '@/components/builder/ControlProperties.vue';
import controlAdder from '@/components/builder/ControlAdder.vue';
import surveyDetails from '@/components/builder/SurveyDetails.vue';
import draft from '@/components/survey/drafts/DraftComponent.vue';
import consoleLog from '@/components/builder/ConsoleLog.vue';

import appMixin from '@/components/mixin/appComponent.mixin';

import appDialog from '@/components/ui/Dialog.vue';

import * as utils from '@/utils/surveys';

const currentDate = new Date();


const initialRelevanceCode = `
/**
 * use \`survey.\` to autocomplete
 * use \`log(message)\` to log to console
 * 
 */
function relevance() {

  // return true or false
  return true;
}
`;

export default {
  mixins: [
    appMixin,
  ],
  components: {
    Multipane,
    MultipaneResizer,
    codeEditor,
    graphicalView,
    controlProperties,
    controlAdder,
    surveyDetails,
    appDialog,
    draft,
    consoleLog,
  },
  data() {
    return {
      // modes
      showCodeEditor: true,
      showMainCode: true,
      editMode: false,
      dirty: false,
      // ui
      viewCode: false,
      showSnackbar: false,
      snackbarMessage: '',
      showConflictModal: false,
      showDeleteModal: false,
      // currently selected control
      control: null,
      // code stuff
      log: '',
      codeError: null,
      evaluated: null,
      relevanceCode: initialRelevanceCode,
      currentControlHasRelevance: false,
      currentControlHasCalculate: false,
      // survey entity
      initialSurvey: null,
      instance: null,
      codeRefreshCounter: 0,
      submissionCode: '',
      survey: {
        _id: '',
        name: '',
        dateCreated: currentDate,
        dateModified: currentDate,
        latestVersion: 1,
        versions: [
          {
            dateCreated: currentDate,
            version: 1,
            controls: [],
          },
        ],
      },
    };
  },
  methods: {
    async runCode(code) {
      const worker = new Worker('/worker.js');
      const surveyCode = utils.codeFromSubmission(this.instance || { data: [] });


      try {
        const res = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('timeout'));
          }, 2000);

          let counter = 0;

          worker.onmessage = (m) => {
            if (m.data.res !== undefined) {
              clearTimeout(timeout);
              resolve(m.data.res);
            } else if (m.data.error) {
              clearTimeout(timeout);
              reject(m.data.error);
            } else if (m.data.log) {
              if (counter++ > 1000) {
                reject(new Error('Too many log messages'));
              } else {
                this.log = `${this.log}${m.data.log}\n`;
              }
            }
          };

          worker.postMessage(
            {
              code,
              surveyCode,
            },
          );
        });

        console.log('evaluated', res);
        this.evaluated = res;
        this.codeError = null;
      } catch (error) {
        console.log(error);
        this.codeError = error;
        this.evaluated = null;
      } finally {
        worker.terminate();
      }
    },
    onChange(value) {
      console.log(value);
    },
    toggleCodeEditor() {
      this.showCodeEditor = !this.showCodeEditor;
    },
    controlSelected(control) {
      this.control = control;
    },
    controlAdded(control) {
      if (!this.control) {
        this.currentControls.push(control);
        this.control = control;
        return;
      }

      const position = utils.getPosition(this.control, this.currentControls);
      utils.insertControl(control, this.currentControls, position, this.control.type === 'group');
      this.control = control;
    },
    onCancel() {
      this.$router.push('/surveys/browse');
    },
    generateId() {
      this.survey._id = new ObjectId();
      this.showConflictModal = false;
    },
    async onDelete() {
      if (!this.showDeleteModal) {
        this.showDeleteModal = true;
        return;
      }
      try {
        await api.delete(`/surveys/${this.survey._id}`);
        this.$router.push('/surveys');
      } catch (error) {
        console.log(error);
      }
    },
    async onSubmit() {
      const method = this.editMode ? 'put' : 'post';
      const url = this.editMode ? `/surveys/${this.survey._id}` : '/surveys';

      try {
        await api.customRequest({
          method, url, data: this.survey,
        });
        this.$router.push('/surveys/browse');
      } catch (error) {
        if (error.response.status === 409) {
          this.showConflictModal = true;
        } else {
          this.snackbarMessage = error.response.data.message;
          this.showSnackbar = true;
        }
      }
    },
    refreshSubmission() {
      console.log('refreshSubmission');
      const code = JSON.stringify(utils.codeFromSubmission(this.instance), null, 4);
      this.submissionCode = `const submission = ${code}\n\nconst survey = ${JSON.stringify(this.survey, null, 4)}`;
    },
  },
  computed: {
    /*
    dirty() {
      if (this.editMode) {
        return !_.isEqualWith(this.survey.versions, this.initialSurvey.versions, (value1, value2, key) => ((key === 'label') ? true : undefined));
      }

      return true;
    },
    */
    currentVersion() {
      return this.survey.latestVersion;
    },
    currentControls() {
      return this.survey.versions.find(item => (item.version === this.survey.latestVersion)).controls;
    },
  },
  watch: {
    currentControlHasRelevance(newVal) {
      console.log('value changed');
      if (newVal) {
        if (!this.control.relevance) {
          this.control.relevance = initialRelevanceCode;
        }
      }

      this.showMainCode = newVal;
    },
    survey: {
      handler(newVal, oldVal) {
        console.log('changed');
        const current = newVal.versions.find(v => v.version === newVal.latestVersion);
        if (current.controls.length === 0) {
          return;
        }
        this.instance = utils.createInstance(newVal, newVal.latestVersion);
        this.refreshSubmission();

        if (this.dirty || !this.editMode || !this.initialSurvey) {
          return;
        }
        if (!_.isEqualWith(newVal.versions, this.initialSurvey.versions, (value1, value2, key) => ((key === 'label') ? true : undefined))) {
          this.dirty = true;
          const { latestVersion } = this.initialSurvey;
          const nextVersion = latestVersion + 1;
          const date = new Date();

          const nextVersionObj = this.survey.versions.find(item => item.version === latestVersion);
          nextVersionObj.version = nextVersion;
          nextVersionObj.dateCreated = date;

          this.$set(this.survey, 'versions', this.initialSurvey.versions);

          this.survey.versions.push(nextVersionObj);
          this.survey.latestVersion = nextVersion;
          this.survey.dateModified = date;
        }
      },
      deep: true,
    },
  },
  async created() {
    this.setNavbarContent(
      {
        title: 'Survey Builder',
      },
    );
    this.editMode = !this.$route.matched.some(
      ({ name }) => name === 'surveys-new',
    );

    this.survey._id = ObjectId();
    this.survey.dateCreated = new Date();

    if (this.editMode) {
      try {
        const { id } = this.$route.params;
        this.survey._id = id;
        const { data } = await api.get(`/surveys/${this.survey._id}`);
        this.survey = { ...this.survey, ...data };
        this.initialSurvey = _.cloneDeep(this.survey);
      } catch (e) {
        console.log('something went wrong:', e);
      }
    }
  },
};
</script>

<style scoped>
.screen-root {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}
.pane-root {
  height: 100%;
  padding: 12px;
  width: 2800px;
  min-width: 100vw;
}

.pane-root > .pane ~ .pane {
  border-left: 1px solid #eee;
}

.horizontal-line {
  border-bottom: 1px solid #eee;
}

.pane {
  will-change: transform;
  transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  height: calc(100vh - 64px - 30px - 24px);
  min-width: 400px;
  max-height: 100%;
  margin-top: 15px;
  margin-left: 15px;
  margin-right: 15px;
  margin-bottom: 0px;
  overflow: hidden;
}

.pane-submission-code,
.pane-main-code {
  min-width: 500px;
}

.pane-survey {
  overflow: auto;
}

.graphical-view {
  overflow: auto;
}

.pane-draft {
  width: 100vw;
  max-width: 500px;
  position: relative;
}

.draft {
  max-width: 500px;
}

.hide-pane {
  transform: translateX(-100%);
}

.no-outline {
  outline: none;
}

.builder-container-squeeze {
  right: calc(48px + 50vw) !important;
}

.code-resizer {
  width: 100%;
  height: 100%;
}

.code-editor {
  width: 100%;
  height: 100%;
  min-width: 100%;
  padding-bottom: 12px;
}

.main-code-editor {
  min-height: 20vw;
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.console-log {
  width: 100%;
  height: 20vw;
  min-height: 10vh;
  flex-grow: 1;
}

.editor-visible {
  transform: translateX(0);
}

.editor-hidden {
  transform: translateX(100%);
}

.pane::-webkit-scrollbar {
  width: 12px;
  background-color: #f5f5f5;
}

.pane::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
  background-image: linear-gradient(120deg, #f44336 0%, #d67a74 100%);
}
.pane::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
  background-color: #f5f5f5;
  border-radius: 10px;
}
</style>
