<template>
  <div
    class="screen-root"
    style="padding: 0px 12px 0px 0px !important"
  >
    <splitpanes
      style="padding: 0px !important"
      class="pane-root"
      vertical
    >
      <pane class="pane pane-survey">
        <graphical-view
          class="graphical-view"
          v-if="!viewCode"
          :selected="control"
          :controls="currentControls"
          @controlSelected="controlSelected"
        />
      </pane>

      <pane class="pane pane-controls">
        <v-card>
          <div class="sticky-top px-4">
            <v-card-title class="pl-0">Details</v-card-title>
            <survey-details
              v-model="survey"
              :editMode="editMode"
              :dirty="dirty"
              @cancel="onCancel"
              @submit="$emit('onSubmit');"
              @delete="$emit('onDelete')"
              :enablePublish="enablePublish"
            />
            <v-divider class="my-4"></v-divider>

            <v-card-title class="pl-0">Add questions</v-card-title>
            <control-adder @controlAdded="controlAdded" />
            <v-divider class="my-4"></v-divider>

            <control-properties
              v-if="control"
              :control="control"
              :survey="survey"
              :relevance="optionsRelevance"
              :calculate="optionsCalculate"
              :constraint="optionsConstraint"
              @code-calculate="highlight('calculate')"
              @code-relevance="highlight('relevance')"
              @code-constraint="highlight('constraint')"
            />
          </div>
        </v-card>
      </pane>
      <pane
        class="pane pane-main-code"
        v-if="hasCode && !hideCode"
      >
        <splitpanes
          horizontal
          class="code-resizer"
        >

          <pane>
            <div style="height: 100%">
              <v-tabs
                v-if="control.options"
                v-model="selectedTab"
                background-color="blue-grey darken-4"
                dark
              >
                <v-tab :disabled="!control.options.relevance.enabled">
                  Relevance
                </v-tab>
                <v-tab :disabled="!control.options.calculate.enabled">
                  Calculate
                </v-tab>
                <v-tab :disabled="!control.options.constraint.enabled">
                  Constraint
                </v-tab>
              </v-tabs>

              <code-editor
                v-if="selectedTab !== null"
                @close="hideCode = true"
                :code="activeCode"
                class="main-code-editor"
                :refresh="codeRefreshCounter"
                runnable="true"
                :error="codeError"
                @run="runCode"
                :result="evaluated"
                @change="updateSelectedCode"
              >
              </code-editor>
            </div>

          </pane>
          <pane>
            <console-log
              class="console-log"
              :log="log"
              @clear="log = ''"
            />
          </pane>
        </splitpanes>
      </pane>
      <pane
        class="pane pane-submission-code"
        v-if="hasCode && !hideCode"
      >
        <div class="code-editor">
          <code-editor
            title="Shared Code"
            v-if="survey"
            class="code-editor"
            readonly="true"
            :code="sharedCode"
            fold="true"
          ></code-editor>
        </div>
      </pane>
      <pane class="pane pane-draft">
        <draft
          @submit="payload => $emit('submit', payload)"
          v-if="survey && instance"
          :submission="instance"
          :survey="survey"
        ></draft>
      </pane>

    </splitpanes>

    <app-dialog
      v-model="showDeleteModal"
      @cancel="showDeleteModal = false"
      @confirm="$emit('onDelete');"
    >
      <template v-slot:title>Confirm your action</template>
      <template>
        Delete survey
        <strong>{{survey._id}}</strong>
        for sure?
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
import { Splitpanes, Pane } from 'splitpanes';

import ObjectId from 'bson-objectid';
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

import submissionUtils from '@/utils/submissions';


const initialRelevanceCode = variable => `
/**
 * BASIC: use \`submission.\` to autocomplete the basic submission
 * ADVANCED: use \`rawSubmission.\` to autocomplete the advanced version of a submission
 * use \`survey.\` to access the current survey and its information
 * use \`log(message)\` to log to console
 * 
 */
function ${variable}() {

  // return true or false
  return true;
}
`;

const tabMap = [
  'relevance',
  'calculate',
  'constraint',
];

export default {
  mixins: [
    appMixin,
  ],
  components: {
    Splitpanes,
    Pane,
    codeEditor,
    graphicalView,
    controlProperties,
    controlAdder,
    surveyDetails,
    appDialog,
    draft,
    consoleLog,
  },
  props: [
    'survey',
    'editMode',
  ],
  data() {
    return {
      // modes
      hideCode: false,
      dirty: false,
      // ui
      enablePublish: false,
      viewCode: false,
      showSnackbar: false,
      snackbarMessage: '',
      showDeleteModal: false,
      // currently selected control
      control: null,
      // code stuff
      log: '',
      codeError: null,
      evaluated: null,
      selectedTab: null,
      optionsRelevance: null,
      optionsCalculate: null,
      optionsConstraint: null,
      activeCode: '',
      // survey entity
      codeRefreshCounter: 0,
      submissionCode: '',
      instance: null,
      initialSurvey: _.cloneDeep(this.survey),
    };
  },
  methods: {
    updateSelectedCode(code) {
      this.control.options[tabMap[this.selectedTab]].code = code;
    },
    highlightNext() {
      [
        this.optionsRelevance,
        this.optionsCalculate,
        this.optionsConstraint,
      ].forEach((item, idx) => {
        if (item.enabled) {
          this.selectedTab = idx;
        }
      });
    },
    highlight(tab, select = true) {
      this.hideCode = false;

      if (!this.control.options[tab].enabled) {
        this.highlightNext();
        return;
      }

      this.selectedTab = tabMap.indexOf(tab);

      if (!this.control.options[tab].code) {
        this.control.options[tab].code = initialRelevanceCode(tab);
      }

      this.activeCode = this.control.options[tabMap[this.selectedTab]].code;
    },
    async runCode() {
      try {
        const res = await utils.execute(this.activeCode, tabMap[this.selectedTab],
          this.instance, this.survey, (arg) => {
            this.log = `${this.log}${arg}\n`;
          });
        if (typeof res !== 'boolean') {
          throw Error('Function must return true or false');
        }
        this.evaluated = res;
        this.codeError = null;
      } catch (error) {
        console.log(error);
        this.codeError = error;
        this.evaluated = null;
      }
    },
    onChange(value) {
      console.log(value);
    },
    controlSelected(control) {
      console.log('selected control', control);
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
  },
  computed: {
    controlId() {
      const position = utils.getPosition(this.control, this.currentControls);
      const id = utils.getFlatName(this.currentControls, position);
      console.log('controlId', id);
      return id;
    },
    hasCode() {
      if (!this.control) {
        return false;
      }
      return this.control.options.relevance.enabled || this.control.options.calculate.enabled || this.control.options.constraint.enabled;
    },
    currentVersion() {
      return this.survey.latestVersion;
    },
    currentControls() {
      console.log('currentcontrols -> survey revision', this.survey.revisions);
      return this.survey.revisions.find(revision => (revision.version === this.survey.latestVersion)).controls;
    },
    sharedCode() {
      if (!this.instance) {
        return '';
      }

      const simplified = utils.simplify(this.instance.data);
      const submission = `
/**
 * This is the basic version of the submission.
 * start typing 'submission.' in order to see completion
 */
  
const submission = ${JSON.stringify(simplified, null, 4)}`;
      const rawSubmission = `
/**
 * This is the raw version of the submission, it includes additional
 * meta information such as question type and modification timestamps.
 * 
 * use this if you need advanced information of the submission
 */
const rawSubmission = ${JSON.stringify(this.instance, null, 4)}`;
      const survey = `
/**
 * This is the survey object. It contains all questions as well
 * as their properties and attributes.
 */

const survey = ${JSON.stringify(this.survey, null, 4)}`;
      return `${submission}\n\n${rawSubmission}\n\n${survey}\n`;
    },
  },
  watch: {
    selectedTab(tab) {
      this.highlight(tabMap[tab]);
    },
    optionsRelevance: {
      handler(newVal) {
        if (!newVal) {
          return;
        }
        this.highlight('relevance', newVal.enabled);
      },
      deep: true,
    },
    optionsCalculate: {
      handler(newVal) {
        if (!newVal) {
          return;
        }
        this.highlight('calculate', newVal.enabled);
      },
      deep: true,
    },
    optionsConstraint: {
      handler(newVal) {
        if (!newVal) {
          return;
        }
        this.highlight('constraint', newVal.enabled);
      },
      deep: true,
    },
    control: {
      handler(newVal) {
        console.log('control changed');
        if (!newVal) {
          this.optionsRelevance = null;
          this.optionsCalculate = null;
          this.optionsConstraint = null;
          return;
        }

        this.optionsRelevance = newVal.options.relevance;
        this.optionsCalculate = newVal.options.calculate;
        this.optionsConstraint = newVal.options.constraint;
      },
      deep: true,
    },
    survey: {
      handler(newVal, oldVal) {
        console.log('survey changed', newVal);

        const current = newVal.revisions.find(revision => revision.version === newVal.latestVersion);
        if (current.controls.length === 0) {
          return;
        }
        this.instance = submissionUtils.createSubmissionFromSurvey(newVal, newVal.latestVersion, this.instance);

        if (this.dirty || !this.editMode || !this.initialSurvey) {
          return;
        }
        if (!_.isEqualWith(newVal.revisions, this.initialSurvey.revisions, (value1, value2, key) => ((key === 'label') ? true : undefined))) {
          this.dirty = true;
          const { latestVersion } = this.initialSurvey;
          const nextVersion = latestVersion + 1;
          const date = new Date();

          const nextVersionObj = this.survey.revisions.find(revision => revision.version === latestVersion);
          nextVersionObj.version = nextVersion;
          nextVersionObj.dateCreated = date;

          this.$set(this.survey, 'revisions', this.initialSurvey.revisions);

          this.survey.revisions.push(nextVersionObj);
          this.survey.latestVersion = nextVersion;
          this.survey.dateModified = date;
        }
      },
      deep: true,
    },
  },
  created() {
    this.setNavbarContent(
      {
        title: 'Survey Builder',
      },
    );
    this.instance = submissionUtils.createSubmissionFromSurvey(this.survey, this.survey.latestVersion, this.instance);
    console.log('instance', this.instance);
    console.log('survey', this.survey);
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

.pane-survey,
.pane-controls {
  overflow: auto;
  width: 400px !important;
}

.pane-submission-code,
.pane-main-code {
  min-width: 700px;
}

.pane-survey {
  overflow: auto;
}

.graphical-view {
  overflow: auto;
}

.pane-draft {
  width: 100vw;
  align-self: center;
}

.pane-draft,
.draft {
  max-width: 500px;
  max-height: 1000px;
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

<style>
.splitpanes {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  width: 100%;
  height: 100%;
}
.splitpanes--vertical {
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
  -ms-flex-direction: row;
  flex-direction: row;
}
.splitpanes--horizontal {
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
}
.splitpanes--dragging * {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
.splitpanes__pane {
  width: 100%;
  height: 100%;
  overflow: hidden;
  -webkit-transition: width 0.2s ease-out, height 0.2s ease-out;
  transition: width 0.2s ease-out, height 0.2s ease-out;
}
.splitpanes--dragging .splitpanes__pane {
  -webkit-transition: none;
  transition: none;
}
.splitpanes__splitter {
  -ms-touch-action: none;
  touch-action: none;
}
.splitpanes--vertical > .splitpanes__splitter {
  min-width: 1px;
  cursor: col-resize;
}
.splitpanes--horizontal > .splitpanes__splitter {
  min-height: 1px;
  cursor: row-resize;
}
.splitpanes.default-theme .splitpanes__pane {
  background-color: #f2f2f2;
}
.splitpanes.default-theme .splitpanes__splitter {
  background-color: #fff;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  position: relative;
}
.splitpanes.default-theme .splitpanes__splitter:after,
.splitpanes.default-theme .splitpanes__splitter:before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  background-color: rgba(0, 0, 0, 0.15);
  -webkit-transition: background-color 0.3s;
  transition: background-color 0.3s;
}
.splitpanes.default-theme .splitpanes__splitter:hover:after,
.splitpanes.default-theme .splitpanes__splitter:hover:before {
  background-color: rgba(0, 0, 0, 0.25);
}
.default-theme.splitpanes .splitpanes .splitpanes__splitter {
  z-index: 1;
}
.default-theme.splitpanes--vertical > .splitpanes__splitter,
.default-theme .splitpanes--vertical > .splitpanes__splitter {
  width: 9px;
  border-left: 1px solid #eee;
  margin-left: -1px;
}
.default-theme.splitpanes--vertical > .splitpanes__splitter:after,
.default-theme .splitpanes--vertical > .splitpanes__splitter:after,
.default-theme.splitpanes--vertical > .splitpanes__splitter:before,
.default-theme .splitpanes--vertical > .splitpanes__splitter:before {
  -webkit-transform: translateY(-50%);
  transform: translateY(-50%);
  width: 1px;
  height: 30px;
}
.default-theme.splitpanes--vertical > .splitpanes__splitter:before,
.default-theme .splitpanes--vertical > .splitpanes__splitter:before {
  margin-left: -2px;
}
.default-theme.splitpanes--vertical > .splitpanes__splitter:after,
.default-theme .splitpanes--vertical > .splitpanes__splitter:after {
  margin-left: 1px;
}
.default-theme.splitpanes--horizontal > .splitpanes__splitter,
.default-theme .splitpanes--horizontal > .splitpanes__splitter {
  height: 9px;
  border-top: 1px solid #eee;
  margin-top: -1px;
}
.default-theme.splitpanes--horizontal > .splitpanes__splitter:after,
.default-theme .splitpanes--horizontal > .splitpanes__splitter:after,
.default-theme.splitpanes--horizontal > .splitpanes__splitter:before,
.default-theme .splitpanes--horizontal > .splitpanes__splitter:before {
  -webkit-transform: translateX(-50%);
  transform: translateX(-50%);
  width: 30px;
  height: 1px;
}
.default-theme.splitpanes--horizontal > .splitpanes__splitter:before,
.default-theme .splitpanes--horizontal > .splitpanes__splitter:before {
  margin-top: -2px;
}
.default-theme.splitpanes--horizontal > .splitpanes__splitter:after,
.default-theme .splitpanes--horizontal > .splitpanes__splitter:after {
  margin-top: 1px;
}
</style>
