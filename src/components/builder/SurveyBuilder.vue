<template>
  <div
    class="screen-root"
    style="padding: 0px 12px 0px 0px !important"
  >
    <v-dialog v-model="viewCode">
      <app-code-view v-model="survey" />
    </v-dialog>

    <v-dialog v-model="showExamples">
      <app-examples-view
        @close="showExamples = false"
        :category="tabMap[selectedTab]"
      />
    </v-dialog>

    <splitpanes
      style="padding: 0px !important"
      class="pane-root"
      vertical
    >
      <pane
        class="pane pane-survey"
        style="position: relative; overflow: hidden"
      >
        <div
          class="pane-fixed-wrapper pr-2"
          style="position: relative;"
        >
          <control-adder @controlAdded="controlAdded" @openLibrary="openLibrary"/>
          <survey-details
            :version="version"
            :draft="isDraft"
            v-model="survey"
            :survey="survey"
            :isNew="!editMode"
            :dirty="dirty"
            :enableUpdate="enableUpdate"
            :enableSaveDraft="enableSaveDraft"
            :enableDismissDraft="enableDismissDraft"
            :enablePublish="enablePublish"
            :validationErrors="surveyValidationErrors"
            @view-code-toggle="viewCode = !viewCode"
            @update="publish"
            @cancel="onCancel"
            @saveDraft="saveDraft"
            @delete="$emit('onDelete')"
            @publish="publish"
            @export-survey="$emit('export-survey')"
            @import-survey="(file) => $emit('import-survey', file)"
            @set-survey-resources="setSurveyResources"
            @addToLibrary="addToLibrary"
            class="mb-4"
          />
          <graphical-view
            class="graphical-view"
            v-if="!viewCode"
            :selected="control"
            :controls="currentControls"
            @controlSelected="controlSelected"
            @duplicate-control="duplicateControl"
            @open-library="openLibrary"
          />
        </div>
      </pane>

      <pane
        class="pane pane-library"
        v-if="library"
      >
        <div class="px-4">
          <question-library
            :survey="survey"
            :libraryId="libraryId"
            @addToSurvey="addQuestionsFromLibrary"
            @cancel="closeLibrary"/>
        </div>
      </pane>

      <pane
        class="pane pane-controls"
        v-if="control"
      >
        <v-card class="pb-3 mb-3">
          <div class="px-4">
            <!-- <v-card-title class="pl-0">Details</v-card-title> -->
            <control-properties
              v-if="control"
              :control="control"
              :survey="survey"
              :calculate="optionsCalculate"
              :relevance="optionsRelevance"
              :constraint="optionsConstraint"
              :api-compose="optionsApiCompose"
              :controls="currentControls"
              @code-calculate="highlight('calculate')"
              @code-relevance="highlight('relevance')"
              @code-constraint="highlight('constraint')"
              @code-api-compose="highlight('apiCompose')"
              @set-control-source="setControlSource"
              @set-survey-resources="setSurveyResources"
              @set-control-params="setControlParams"
              @set-script-editor-is-visible="setScriptIsVisible"
            />
          </div>
        </v-card>
      </pane>
      <pane
        class="pane pane-script"
        v-if="hasScript && scriptEditorIsVisible && scriptCode !== null"
      >
        <code-editor
          :saveable="true"
          :readonly="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
          @close="() => setScriptIsVisible(false)"
          :code="scriptCode.content"
          class="main-code-editor"
          :refresh="codeRefreshCounter"
          @change="updateScriptCode"
          @save="saveScript"
        >
        </code-editor>
      </pane>

      <pane
        class="pane pane-main-code"
        v-if="hasCode && !hideCode"
      >
        <splitpanes
          horizontal
          class="code-resizer"
        >

          <pane size="80">
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
                <v-tab
                  v-if="control.options.apiCompose"
                  :disabled="!control.options.apiCompose.enabled"
                >
                  API Compose
                </v-tab>
                <v-tab v-if="control.type === 'script'">
                  Script
                </v-tab>
              </v-tabs>

              <code-editor
                v-if="selectedTab !== null"
                @close="hideCode = true"
                :code="activeCode"
                :readonly="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
                class="main-code-editor"
                :refresh="codeRefreshCounter"
                runnable="true"
                :error="codeError"
                @run="runCode"
                :result="evaluated"
                @change="updateSelectedCode"
                :examples="true"
                @examples="showExamples = true"
              >
              </code-editor>
            </div>
          </pane>
          <pane size="20">
            <console-log
              class="console-log"
              :log="log"
              @clear="log = ''"
            />
          </pane>
        </splitpanes>
      </pane>
      <pane
        class="pane pane-submission-code pane-shared-code"
        v-if="(hasCode && !hideCode) || (hasScript && scriptEditorIsVisible)"
      >
        <div class="code-editor">
          <code-editor
            title="Shared Code"
            v-if="survey"
            class="code-editor"
            readonly="true"
            :code="sharedCode"
          ></code-editor>
        </div>
      </pane>
      <pane class="pane pane-draft">
        <!-- this is a hack to make preview work inside panes... not sure where 182px is coming from -->
        <div style="height: calc(100vh - 182px); max-height: calc(100vh - 182px);">
          <app-draft-component
            @submit="payload => $emit('submit', payload)"
            v-if="survey && instance"
            :submission="instance"
            :survey="survey"
            :persist="false"
            class="builder-draft"
            builder
          ></app-draft-component>
        </div>
        <v-overlay :value="enableSaveDraft">
          <v-card>
            <v-card-text>
              Please Save Draft to update Survey Preview.
            </v-card-text>
          </v-card>
        </v-overlay>
      </pane>

    </splitpanes>

    <!-- <confirm-leave-dialog
      ref="confirmLeaveDialog"
      title="Confirm Leave Survey"
    >
      Are you sure you want to leave this survey?
    </confirm-leave-dialog> -->
  </div>
</template>

<script>
import {
  cloneDeep, isEqualWith, isEqual, uniqBy,
} from 'lodash';
import { Splitpanes, Pane } from 'splitpanes';

import moment from 'moment';

import ObjectID from 'bson-objectid';
import graphicalView from '@/components/builder/GraphicalView.vue';
import controlProperties from '@/components/builder/ControlProperties.vue';
import questionLibrary from '@/components/builder/QuestionLibrary.vue';
import controlAdder from '@/components/builder/ControlAdder.vue';
import surveyDetails from '@/components/builder/SurveyDetails.vue';
import appDraftComponent from '@/components/survey/drafts/DraftComponent.vue';
import consoleLog from '@/components/builder/ConsoleLog.vue';

import appCodeView from '@/components/builder/CodeView.vue';
import appExamplesView from '@/components/builder/ExamplesView.vue';

import appMixin from '@/components/mixin/appComponent.mixin';
import api from '@/services/api.service';
import slugify from '@/utils/slugify';

import * as utils from '@/utils/surveys';
import { defaultApiCompose } from '@/utils/apiCompose';

import submissionUtils from '@/utils/submissions';
import { SPEC_VERSION_SCRIPT } from '@/constants';
import { availableControls, createControlInstance } from '@/utils/surveyConfig';
import * as surveyStackUtils from '@/utils/surveyStack';

const codeEditor = () => import('@/components/ui/CodeEditor.vue');

const initialRelevanceCode = variable => `\
/**
 * ${variable.charAt(0).toUpperCase() + variable.substr(1)}
 *
 * @param {submission} submission
 * @param {survey} survey
 * @param {parent} parent
 */
function ${variable}(submission, survey, parent) {
  return true;
}
`;

const tabMap = [
  'relevance',
  'calculate',
  'constraint',
  'apiCompose',
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
    questionLibrary,
    controlProperties,
    controlAdder,
    surveyDetails,
    appDraftComponent,
    consoleLog,
    appCodeView,
    // ConfirmLeaveDialog,
    appExamplesView,
  },
  props: [
    'survey',
    'editMode',
    'freshImport',
  ],
  data() {
    return {
      tabMap,
      // modes
      hideCode: false,
      scriptEditorIsVisible: false,
      dirty: false,
      version: 1,
      // ui
      viewCode: false,
      // currently selected control
      control: null,
      library: false,
      libraryId: null,
      // code stuff
      log: '',
      codeError: null,
      evaluated: null,
      selectedTab: null,
      optionsRelevance: null,
      optionsCalculate: null,
      optionsConstraint: null,
      optionsApiCompose: null,
      activeCode: '',
      scriptCode: null,
      // survey entity
      codeRefreshCounter: 0,
      submissionCode: '',
      instance: null,
      initialSurvey: cloneDeep(this.survey),
      surveyUnchanged: true,
      showExamples: false,
    };
  },
  methods: {
    async saveScript() {
      console.log('saving script');
      // post new script
      const data = this.scriptCode;
      const method = this.scriptCode._id !== null ? 'put' : 'post';
      const url = this.scriptCode._id !== null ? `/scripts/${this.scriptCode._id}` : '/scripts';

      if (this.scriptCode.name.trim() === '') {
        console.log('Name must not be empty');
        return;
      }

      try {
        await api.customRequest({
          method,
          url,
          data,
        });
        // this.$router.push('/scripts');
      } catch (err) {
        console.log(err);
      }
    },
    setScriptIsVisible(val) {
      console.log('hello');
      this.scriptEditorIsVisible = val;
    },
    updateScriptCode(code) {
      this.scriptCode.content = code;
    },
    publish() {
      this.$emit('onPublish');
    },
    saveDraft() {
      if (!this.isDraft) {
        this.createDraft();
        this.initNavbarAndDirtyFlag(this.survey);
      }
      this.$emit('onSaveDraft');
    },
    createDraft() {
      this.dirty = true;
      const { latestVersion } = this.initialSurvey;
      const nextVersion = latestVersion + 1;
      const date = moment().toISOString(true);

      const nextVersionObj = this.survey.revisions.find(revision => revision.version === latestVersion);
      nextVersionObj.version = nextVersion;
      nextVersionObj.dateCreated = date;

      this.$set(this.survey, 'revisions', cloneDeep(this.initialSurvey.revisions));

      this.survey.revisions.push(nextVersionObj);
      this.survey.meta.dateModified = date;
    },
    addToLibrary() {
      console.log('add to library');
      this.survey.meta.isLibrary = true;
      this.saveDraft();
    },
    async addQuestionsFromLibrary(librarySurveyId) {
      // load library survey
      const { data } = await api.get(`/surveys/${librarySurveyId}`);

      // remove old resources copied from the library survey
      this.survey.resources = this.survey.resources.filter(value => value.libraryId !== librarySurveyId);
      // copy resources from library survey
      data.resources.forEach((r) => {
        r.libraryId = data._id;
        r.libraryVersion = data.latestVersion;
      });
      this.survey.resources = this.survey.resources.concat(data.resources);

      // copy controls from library survey
      const controlsFromLibrary = data.revisions[data.latestVersion - 1].controls;

      // create question group
      const group = createControlInstance(
        availableControls.find(c => c.type === 'group'),
      );
      group.name = slugify(data.name);
      group.label = data.name;
      group.isLibraryRoot = true;
      group.libraryId = data._id;
      group.libraryVersion = data.latestVersion;

      // add recursive function for children
      const dive = (control, cb) => {
        cb(control);
        if (!control.children) {
          return;
        }
        control.children.forEach((c) => {
          dive(c, cb);
        });
      };

      // copy questions from library survey to question group
      for (let i = 0; i < controlsFromLibrary.length; i++) {
        const controlToAdd = controlsFromLibrary[i];
        controlToAdd.id = new ObjectID().toString();
        controlToAdd.libraryId = data._id;
        dive(controlToAdd, (control) => {
          // eslint-disable-next-line no-param-reassign
          control.id = new ObjectID().toString();
          control.libraryId = data._id;
          control.libraryVersion = data.latestVersion;
        });
        group.children.push(controlToAdd);
      }
      this.duplicateControl(group);
      this.library = false;
    },
    closeLibrary() {
      this.library = false;
    },
    initNavbarAndDirtyFlag(survey) {
      if (!survey.revisions) {
        this.dirty = false;
      } else if (survey.revisions.length === 1 && !this.editMode) {
        this.dirty = true;
      } else {
        const len = survey.revisions.length;
        this.dirty = survey.revisions[len - 1].version !== survey.latestVersion;
      }

      if (!this.dirty && !isEqualWith(survey.revisions, this.initialSurvey.revisions, (value1, value2, key) => ((key === 'label') ? true : undefined))) {
        this.createDraft();
      }

      let version = this.dirty ? `${survey.latestVersion + 1} (draft)` : survey.latestVersion;
      if (!this.editMode && survey.revisions.length === 1) {
        version = 1;
      }

      this.version = version;

      const v = this.survey.revisions[this.survey.revisions.length - 1].version;
      const amountQuestions = utils.getSurveyPositions(this.survey, v);
      // console.log('amount: ', amountQuestions);
      this.setNavbarContent({
        title: this.survey.name || 'Untitled Survey',
        subtitle: `
          <span class="question-title-chip">Version ${version}</span>
          <!--<span class="ml-2">${amountQuestions.length} Question${amountQuestions.length > 1 || amountQuestions.length < 1 ? 's' : ''}</span>-->
          <!--<span class="question-title-chip">${this.groupPath}</span>-->
        `,
      });

      // console.log('version is', version);
    },
    updateSelectedCode(code) {
      this.control.options[tabMap[this.selectedTab]].code = code;
      this.activeCode = code;
    },
    highlightNext() {
      [
        this.optionsRelevance,
        this.optionsCalculate,
        this.optionsConstraint,
        this.optionsApiCompose,
      ].filter(o => o !== undefined).forEach((item, idx) => {
        if (item.enabled) {
          this.selectedTab = idx;
        }
      });
    },
    highlight(tab, select = true) {
      this.codeError = null;
      this.evaluated = null;

      this.hideCode = false;

      if (this.control.options[tab] && !this.control.options[tab].enabled) {
        this.highlightNext();
        return;
      }

      this.selectedTab = tabMap.indexOf(tab);

      console.log('options', this.control.options);
      if (!this.control.options[tab].code) {
        let initalCode;
        console.log('tab is', tab);
        if (tab === 'apiCompose') {
          initalCode = defaultApiCompose;
        } else {
          initalCode = initialRelevanceCode(tab);
        }

        this.control.options[tab].code = initalCode;
        this.activeCode = initalCode;
      } else {
        this.activeCode = this.control.options[tab].code;
      }
    },
    async runCode() {
      const tab = tabMap[this.selectedTab];
      try {
        const res = await utils.executeUnsafe(
          {
            code: this.activeCode,
            fname: tab,
            submission: this.instance,
            survey: this.survey,
            parent: this.parent,
            log: (arg) => {
              this.log = `${this.log}${arg}\n`;
            },
          },
        );
        if (tab === 'apiCompose') {
          if ((typeof res !== 'object')) {
            throw Error('Function must return an object');
          }
        } else if (typeof res !== 'boolean') {
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
    async controlSelected(control) {
      // console.log('selected control', control);
      this.control = control;
      console.log('controlSelected', control);
      if (control && control.type === 'script' && control.options.source) {
        const data = await this.fetchScript(control.options.source);
        this.scriptEditorIsVisible = false;
        this.setScriptCode(data);
      } else {
        this.scriptCode = null;
      }
    },
    async fetchScript(id) {
      const { data } = await api.get(`/scripts/${id}`);
      return data;
    },
    setScriptCode(data) {
      if (!data) {
        // default empty script...
        // ideally we shouldnt need to instantiate inside SurveyBuilder
        this.scriptCode = {
          _id: null,
          name: 'New Script',
          meta: {
            dateCreated: new Date(),
            dateModified: null,
            revision: 1,
            creator: null,
            group: { id: null, path: null },
            specVersion: SPEC_VERSION_SCRIPT,
          },
          content: '',
        };
        return;
      }

      this.scriptCode = data;
    },
    duplicateControl(control) {
      if (this.control && this.currentControls.length > 0) {
        const position = utils.getPosition(this.control, this.currentControls);
        utils.insertControl(control, this.currentControls, position, this.control.type === 'group' || this.control.type === 'page');
      } else {
        utils.insertControl(control, this.currentControls, 0, false);
      }
      this.control = control;
    },
    controlAdded(control) {
      if (!this.control) {
        this.currentControls.push(control);
        this.control = control;
        return;
      }

      const position = utils.getPosition(this.control, this.currentControls);
      utils.insertControl(control, this.currentControls, position, this.control.type === 'group' || this.control.type === 'page');
      this.control = control;
      this.library = false;
    },
    openLibrary(libraryId) {
      this.control = null;
      this.library = true;
      if (libraryId) {
        this.libraryId = libraryId;
      } else {
        this.libraryId = null;
      }
    },
    onCancel() {
      this.$router.push('/surveys/browse');
    },
    async setControlSource(value) {
      this.$set(this.control.options, 'source', value);
      if (this.control.type === 'script') {
        const data = await this.fetchScript(value);
        this.setScriptCode(data);
      }
    },
    setSurveyResources(resources) {
      this.$set(this.survey, 'resources', resources);
    },
    setControlParams(params) {
      this.control.options.params = params;
    },
    validateSurveyName() {
      return !!this.survey.name && /^[\w-\s]{5,}$/.test(this.survey.name)
        ? true
        : 'Survey name is invalid';
    },
    validateSurveyQuestions() {
      const namePattern = /^[\w-]{1,}$/; // one character should be ok, especially within groups
      const currentControls = this.survey.revisions[this.survey.revisions.length - 1].controls;
      const uniqueNames = uniqBy(currentControls, 'name');
      const hasOnlyUniqueNames = uniqueNames.length === currentControls.length;
      const allNamesContainOnlyValidCharacters = !currentControls.some(
        control => !namePattern.test(control.name),
      );

      const groupedQuestionsAreValid = utils.getGroups(currentControls).reduce((r, group) => {
        const uniqueNamesInGroup = uniqBy(group.children, 'name');
        const groupHasOnlyUniqueNames = uniqueNamesInGroup.length === group.children.length;
        const allNamesInGroupContainOnlyValidCharacters = !group.children.some(
          control => !namePattern.test(control.name),
        );
        return r
          && groupHasOnlyUniqueNames
          && allNamesInGroupContainOnlyValidCharacters;
      }, true);

      return (hasOnlyUniqueNames
        && allNamesContainOnlyValidCharacters
        && groupedQuestionsAreValid) ? true : 'Questions list contains an invalid data name';
    },
    setSurveyName(value) {
      this.$set(this.survey, 'name', value);
      this.$forceUpdate();
    },
    setSurveyGroup(value) {
      this.$set(this.survey, 'group', value);
    },
    setSurveyDescription(value) {
      this.$set(this.survey, 'description', value);
    },
    createInstance() {
      const { version } = this.survey.revisions[this.survey.revisions.length - 1];
      const group = this.$store.getters['memberships/activeGroup'];

      this.instance = submissionUtils.createSubmissionFromSurvey({
        survey: this.survey, version, group, instance: this.instance,
      });
    },
  },
  computed: {
    surveyIsValid() {
      // return this.invalidValidations.length > 0 ? invalidValidations : true;
      return !(this.surveyValidationErrors.length > 0);
    },
    surveyValidationErrors() {
      const validations = [
        this.validateSurveyName(),
        this.validateSurveyQuestions(),
      ];
      return validations.filter(validation => validation !== true);
    },
    enableDismissDraft() {
      return this.isDraft;
    },
    isDraft() {
      if (!this.survey.revisions || this.survey.revisions.length < 2) {
        return false;
      }

      const len = this.survey.revisions.length;
      return this.survey.revisions[len - 1].version !== this.survey.latestVersion;
    },
    enableUpdate() {
      if (!this.surveyIsValid) {
        return false;
      }

      if (this.isDraft) {
        return false;
      }
      if (
        (this.initialSurvey.name !== this.survey.name)
        || (this.initialSurvey.description !== this.survey.description || (this.initialSurvey.meta.submissions !== this.survey.meta.submissions))
      ) {
        return true;
      }
      if (this.surveyUnchanged) {
        return false;
      }
      return !this.isDraft;
    },
    enableSaveDraft() {
      if (!this.surveyIsValid) {
        return false;
      }

      if (this.freshImport) {
        return true;
      }

      if (!this.editMode) { // if survey new
        if (this.initialSurvey.name !== this.survey.name) {
          return true;
        }
      }

      return !this.surveyUnchanged;
    },
    enablePublish() {
      if (!this.surveyIsValid) {
        return false;
      }

      if (!this.editMode) {
        if (this.initialSurvey.name !== this.survey.name) {
          return true;
        }
      }

      return this.dirty;
    },
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
      return this.control.options.relevance.enabled
        || this.control.options.calculate.enabled
        || this.control.options.constraint.enabled
        || this.control.options.apiCompose.enabled;
    },
    hasScript() {
      if (!this.control) {
        return false;
      }
      return this.control.type === 'script';
    },
    currentVersion() {
      return this.survey.revisions[this.survey.revisions.length - 1].version;
    },
    currentControls() {
      return this.survey.revisions[this.survey.revisions.length - 1].controls;
    },
    sharedCode() {
      if (!this.instance) {
        return '';
      }

      // const data = `const Data = ${JSON.stringify(this.instance.data, null, 2)}`;
      const submission = `const submission = ${JSON.stringify(this.instance, null, 2)}`;
      const parent = `const parent = ${JSON.stringify(this.parent, null, 2)}`;
      return `${submission};\n\n${parent};\n`;
    },
    parent() {
      console.log('parent() called');
      const position = utils.getPosition(this.control, this.currentControls);
      const path = utils.getFlatName(this.currentControls, position);
      const parentPath = surveyStackUtils.getParentPath(path);
      const parentData = surveyStackUtils.getNested(this.instance, parentPath);
      return parentData;
    },
  },
  watch: {
    selectedTab(tab) {
      console.log('selecting tab', tab);
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
    optionsApiCompose: {
      handler(newVal) {
        if (!newVal) {
          return;
        }
        this.highlight('apiCompose', newVal.enabled);
      },
      deep: true,
    },
    control: {
      handler(newVal) {
        const emptyOptions = {
          enabled: false,
          code: '',
        };

        if (!newVal) {
          this.optionsRelevance = null;
          this.optionsCalculate = null;
          this.optionsConstraint = null;
          this.optionsApiCompose = null;
          return;
        }

        this.optionsRelevance = newVal.options.relevance || cloneDeep(emptyOptions);
        this.optionsCalculate = newVal.options.calculate || cloneDeep(emptyOptions);
        this.optionsConstraint = newVal.options.constraint || cloneDeep(emptyOptions);
        this.optionsApiCompose = newVal.options.apiCompose || cloneDeep(emptyOptions);
      },
      deep: true,
    },
    survey: {
      handler(newVal, oldVal) {
        this.initNavbarAndDirtyFlag(newVal);
        if (!this.initialSurvey || !this.survey) {
          this.surveyUnchanged = true;
        }

        const resourcesAreEqual = isEqual(this.initialSurvey.resources, newVal.resources);
        const revisionsAreEqual = isEqual(this.initialSurvey.revisions, newVal.revisions);
        const surveyDetailsAreEquivalent = (this.initialSurvey.name === newVal.name)
          && isEqual(this.initialSurvey.meta.group, newVal.meta.group)
          && (this.initialSurvey.description === newVal.description);
        this.surveyUnchanged = revisionsAreEqual
          && surveyDetailsAreEquivalent
          && resourcesAreEqual;

        const current = newVal.revisions[newVal.revisions.length - 1];
        if (current.controls.length === 0) {
          return;
        }

        // if only relevance changes, don't flush results
        this.createInstance();
      },
      deep: true,
    },
  },
  created() {
    this.initNavbarAndDirtyFlag(this.survey);
    this.createInstance();
  },

  // TODO: get route guard to work here, or move dirty flag up to Builder.vue
  // beforeRouteLeave(to, from, next) {
  //   console.log('hello');
  //   if (true) {
  //     this.$refs.confirmLeaveDialog.open(next);
  //     return;
  //   }
  //   next(true);
  // },
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
  width: 500px !important;
}

.pane-library {
  overflow: auto;
  width: 1000px !important;
  border-style:solid !important;
  border-width:5px !important;
  border-color:#4CAF50 !important;
}

.pane-submission-code,
.pane-main-code {
  min-width: 800px;
}

.pane-shared-code {
  min-width: 500px;
}

.pane-script {
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
  overflow: auto;
}

.pane-draft,
.draft {
  max-width: 500px;
  /*max-height: 1000px;*/
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

/* .pane::-webkit-scrollbar {
  width: 12px;
  background-color: #f5f5f5;
} */

/* .pane::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
  background-image: linear-gradient(120deg, #f44336 0%, #d67a74 100%);
} */
/* .pane::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
  background-color: #f5f5f5;
  border-radius: 10px;
} */

.pane-fixed-wrapper {
  height: 100%;
  width: 100%;
  overflow: auto;
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
