<template>
  <div class="screen-root bg-white">
    <a-dialog v-model="viewCode">
      <app-code-view :modelValue="JSON.stringify(surveyUnderWork, null, 2)" readOnly style="height: 80vh" />
    </a-dialog>
    <a-dialog v-model="viewSubmission">
      <app-code-view :modelValue="JSON.stringify(instance, null, 2)" readOnly style="height: 80vh" />
    </a-dialog>

    <a-dialog v-model="showExamples">
      <app-examples-view @close="showExamples = false" :category="tabMap[selectedTab]" />
    </a-dialog>

    <update-library-dialog
      v-if="updateLibraryDialogIsVisible"
      v-model="updateLibraryDialogIsVisible"
      :library-root-group="updateLibraryRootGroup"
      :to-survey="updateToLibrary"
      @update="updateLibraryConfirmed"
      @cancel="updateLibraryCancelled" />

    <a-alert
      v-if="Object.keys(availableLibraryUpdates).length > 0"
      variant="text"
      type="warning"
      color="orange"
      elevation="2"
      closable>
      This survey uses an outdated question library set. Consider reviewing the new version and updating it.
    </a-alert>

    <splitpanes class="pane-root bg-white" vertical>
      <pane class="pane pane-survey">
        <div class="pane-fixed-wrapper pr-2" style="position: relative">
          <control-adder @controlAdded="controlAdded" @openLibrary="openLibrary" />
          <survey-details
            :version="version"
            :draft="isDraft"
            v-model="surveyUnderWork"
            :survey="survey"
            :isNew="!editMode"
            :isSaving="isSaving"
            :isUpdating="isUpdating"
            :dirty="dirty"
            :enableUpdate="enableUpdate"
            :enableSaveDraft="enableSaveDraft"
            :enableDismissDraft="enableDismissDraft"
            :enablePublish="enablePublish"
            :validationErrors="surveyValidationErrors"
            @view-code-toggle="viewCode = !viewCode"
            @update="publish"
            @saveDraft="saveDraft"
            @archive="$emit('onArchive')"
            @publish="publish"
            @export-survey="$emit('export-survey')"
            @import-survey="(file) => $emit('import-survey', file)"
            @set-survey-resources="setSurveyResources"
            @addToLibrary="addToLibrary"
            class="mb-4"
            data-testid="survey-details"
            @show-version-dialog="$emit('show-version-dialog')" />
          <graphical-view
            v-if="!viewCode"
            :selected="control"
            :modelValue="currentControls"
            @update:modelValue="updateSurvey"
            :availableLibraryUpdates="availableLibraryUpdates"
            :libraryId="showLibrary ? libraryId : null"
            @control-selected="controlSelected"
            @duplicate-control="duplicateControl"
            @toggle-library="toggleLibrary"
            @control-removed="controlRemoved"
            @update-library-control="updateLibrary"
            @hide-control="hideControl"
            @unhide-control="unhideControl"
            data-testid="graphical-view" />
        </div>
      </pane>

      <pane class="pane pane-library" v-if="showLibrary">
        <div class="px-4">
          <question-library
            :survey="surveyUnderWork"
            :libraryId="libraryId"
            @add-questions-from-library="addQuestionsFromLibrary"
            @cancel="closeLibrary"
            data-testid="question-library" />
        </div>
      </pane>
      <pane class="pane pane-controls" v-if="control">
        <a-card class="px-4 pb-3 m-2 mb-3">
          <control-properties
            v-if="control"
            :control="control"
            :survey="surveyUnderWork"
            :initialize="optionsInitialize"
            :calculate="optionsCalculate"
            :relevance="optionsRelevance"
            :constraint="optionsConstraint"
            :api-compose="optionsApiCompose"
            :controls="currentControls"
            @code-initialize="highlight('initialize')"
            @code-calculate="highlight('calculate')"
            @code-relevance="highlight('relevance')"
            @code-constraint="highlight('constraint')"
            @code-api-compose="highlight('apiCompose')"
            @set-control-source="setControlSource"
            @set-survey-resources="setSurveyResources"
            @set-control-params="setControlParams"
            @set-script-editor-is-visible="setScriptIsVisible"
            data-testid="control-properties" />
        </a-card>
      </pane>
      <pane class="pane pane-script" v-if="hasScript && scriptEditorIsVisible && scriptCode !== null">
        <a-alert
          v-if="successMessage"
          style="cursor: pointer"
          type="success"
          variant="outlined"
          closable
          @click:close="successMessage = null">
          {{ successMessage }}
        </a-alert>
        <a-alert
          v-if="errorMessage"
          style="cursor: pointer"
          type="error"
          variant="outlined"
          closable
          @click:close="errorMessage = null">
          {{ errorMessage }}
        </a-alert>
        <code-editor
          :saveable="scriptIsSavable"
          :readonly="!scriptIsSavable"
          @close="() => setScriptIsVisible(false)"
          :code="scriptCode.content"
          class="main-code-editor"
          @change="updateScriptCode"
          @save="saveScript"
          :isClosable="true"
          :title="`Script: ${scriptCode.name}`" />
      </pane>

      <pane class="pane pane-main-code" v-if="hasCode && !hideCode">
        <splitpanes horizontal class="code-resizer">
          <pane size="80">
            <div style="height: 100%">
              <a-tabs v-if="control.options" v-model="selectedTab">
                <a-tab :disabled="!control.options.relevance.enabled"> Relevance</a-tab>
                <a-tab :disabled="!control.options.initialize.enabled"> Initialize</a-tab>
                <a-tab :disabled="!control.options.calculate.enabled"> Calculate</a-tab>
                <a-tab :disabled="!control.options.constraint.enabled"> Constraint</a-tab>
                <a-tab v-if="control.options.apiCompose" :disabled="!control.options.apiCompose.enabled">
                  API Compose
                </a-tab>
                <a-tab v-if="control.type === 'script'"> Script</a-tab>
              </a-tabs>

              <code-editor
                v-if="selectedTab !== null"
                @close="hideCode = true"
                :code="activeCode"
                :readonly="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
                class="main-code-editor"
                runnable="true"
                :error="codeError"
                @run="runCode"
                :result="evaluated"
                @change="updateSelectedCode"
                :examples="true"
                @examples="showExamples = true" />
            </div>
          </pane>
          <pane size="20">
            <console-log class="console-log" :log="log" @clear="log = ''" />
          </pane>
        </splitpanes>
      </pane>

      <pane
        class="pane pane-submission-code pane-shared-code"
        v-if="(hasCode && !hideCode) || (hasScript && scriptEditorIsVisible)">
        <div class="code-editor">
          <code-editor title="Shared Code" v-if="survey" class="code-editor" :readonly="true" :code="sharedCode" />
        </div>
      </pane>

      <pane class="pane pane-draft" :style="{ width: isPreviewMobile ? '375px' : '800px' }">
        <!-- this is a hack to make preview work inside panes... not sure where 182px is coming from -->
        <div id="previewSurvey" style="height: calc(100vh - 182px); max-height: calc(100vh - 182px); overflow: auto">
          <app-draft-component
            @submit="(payload) => $emit('submit', payload)"
            v-if="survey && instance"
            :submission="instance"
            :survey="surveyUnderWork"
            :persist="false"
            class="builder-draft"
            builder
            :forceMobile="isPreviewMobile">
            <template v-slot:toolbar-actions>
              <a-btn-toggle v-model="isPreviewMobile" style="height: 36px" class="my-auto">
                <a-btn :value="false" dense variant="outlined">
                  <span class="hidden-sm-and-down">desktop</span>
                  <a-icon right>mdi-monitor</a-icon>
                </a-btn>

                <a-btn :value="true" variant="outlined">
                  <span class="hidden-sm-and-down">mobile</span>
                  <a-icon right>mdi-cellphone</a-icon>
                </a-btn>
              </a-btn-toggle>

              <a-btn @click="viewCode = true" class="ma-2" variant="outlined">
                <span class="hidden-sm-and-down">survey</span>
                <a-icon right>mdi-code-tags</a-icon>
              </a-btn>

              <a-btn @click="viewSubmission = true" class="ma-2" variant="outlined">
                <span class="hidden-sm-and-down">response</span>
                <a-icon right>mdi-code-tags</a-icon>
              </a-btn>
            </template>
          </app-draft-component>
        </div>

        <a-overlay
          :modelValue="enableSaveDraft"
          contained
          class="align-center justify-center"
          theme="dark"
          scrim="black"
          persistent>
          <a-card>
            <a-card-text> Please Save Draft to update Survey Preview.</a-card-text>
          </a-card>
        </a-overlay>
      </pane>

      <!-- Padding pane - DO NOT DELETE -->
      <pane />
    </splitpanes>
  </div>
</template>

<script>
import { cloneDeep, get, isEqual, isEqualWith, uniqBy } from 'lodash';
import { Pane, Splitpanes } from 'splitpanes';
import graphicalView from '@/components/builder/GraphicalView.vue';
import controlProperties from '@/components/builder/ControlProperties.vue';
import questionLibrary from '@/components/survey/library/QuestionLibrary.vue';
import controlAdder from '@/components/builder/ControlAdder.vue';
import surveyDetails from '@/components/builder/SurveyDetails.vue';
import appDraftComponent from '@/components/survey/drafts/DraftComponent.vue';
import consoleLog from '@/components/builder/ConsoleLog.vue';
import appCodeView from '@/components/builder/CodeView.vue';
import appExamplesView from '@/components/builder/ExamplesView.vue';
import UpdateLibraryDialog from '@/components/survey/library/UpdateLibraryDialog';
import slugify from '@/utils/slugify';
import { defaultApiCompose } from '@/utils/apiCompose';
import { createSubmissionFromSurvey } from '@/utils/submissions';
import { availableControls, createControlInstance } from '@/utils/surveyConfig';
import { SPEC_VERSION_SCRIPT } from '@/constants';
import {
  executeUnsafe,
  getFlatName,
  getGroups,
  getPosition,
  getPreparedLibraryControls,
  getPreparedLibraryResources,
  getSurveyPositions,
  insertControl,
  isResourceReferenced,
} from '@/utils/surveys';
import api from '@/services/api.service';
import { getParentPath } from '@/utils/surveyStack';
import { resourceLocations, resourceTypes, setResource } from '@/utils/resources';
import ObjectId from 'bson-objectid';
import { defineAsyncComponent } from 'vue';

const codeEditor = defineAsyncComponent(() => import('@/components/ui/CodeEditor.vue'));

const initialRelevanceCode = (variable) => `\
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

const initialInitializeCode = (variable) => `\
/**
 * ${variable.charAt(0).toUpperCase() + variable.substr(1)}
 *
 * @param {submission} submission
 * @param {survey} survey
 * @param {parent} parent
 */
function ${variable}(submission, survey, parent) {
  return null;
}
`;

const tabMap = ['relevance', 'initialize', 'calculate', 'constraint', 'apiCompose'];

export default {
  components: {
    UpdateLibraryDialog,
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
  props: ['survey', 'editMode', 'freshImport', 'isSaving', 'isUpdating'],
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
      viewSubmission: false,
      // currently selected control
      control: null,
      showLibrary: false,
      libraryId: null,
      // code stuff
      log: '',
      codeError: null,
      evaluated: null,
      selectedTab: null,
      optionsRelevance: null,
      optionsInitialize: null,
      optionsCalculate: null,
      optionsConstraint: null,
      optionsApiCompose: null,
      activeCode: '',
      scriptCode: null,
      // survey entity
      surveyUnderWork: this.survey,
      submissionCode: '',
      instance: null,
      initialSurvey: cloneDeep(this.survey),
      surveyUnchanged: true,
      showExamples: false,
      isPreviewMobile: false,
      //question sets
      availableLibraryUpdates: {},
      updateLibraryDialogIsVisible: false,
      updateLibraryRootGroup: null,
      updateToLibrary: null,
      //successMessage and errorMessage for script update
      timeoutID: undefined,
      successMessage: null,
      errorMessage: null,
    };
  },
  methods: {
    async saveScript() {
      if (this.scriptCode.name.trim() === '') {
        console.log('Name must not be empty');
        return;
      }

      if (!this.scriptIsSavable) {
        this.error(
          "This script is managed by another group, so you can't save it.  If you want to make changes, contact the group who manages this script. Otherwise, you can copy the script contents and create your own script in your group which you can control directly."
        );
        return;
      }

      try {
        if (this.scriptCode._id !== null) {
          await api.put(`/scripts/${this.scriptCode._id}`, this.scriptCode);
        } else {
          await api.post('/scripts', this.scriptCode);
        }
        this.success('successfully saved');
      } catch (err) {
        this.error(err);
        console.log(err);
      }
    },
    setScriptIsVisible(val) {
      this.scriptEditorIsVisible = val;
    },
    updateScriptCode(code) {
      this.scriptCode.content = code;
    },
    publish() {
      if (!this.isDraft) {
        // handle the specific case of Version 1 to upgrade directly to Version 2
        // Version 1 is defined at the creation stage, but is also used for rendering draft chips
        this.createDraft();
        this.initDirtyFlag(this.surveyUnderWork);
      }
      this.$emit('onPublish');
    },
    saveDraft() {
      if (!this.isDraft) {
        this.createDraft();
        this.initDirtyFlag(this.surveyUnderWork);
      }
      this.$emit('onSaveDraft');
    },
    createDraft() {
      this.dirty = true;
      const { latestVersion } = this.initialSurvey;
      const nextVersion = latestVersion + 1;
      const date = new Date().toISOString();

      const nextVersionObj = this.surveyUnderWork.revisions.find((revision) => revision.version === latestVersion);
      nextVersionObj.version = nextVersion;
      nextVersionObj.dateCreated = date;
      this.surveyUnderWork.revisions = cloneDeep(this.initialSurvey.revisions);
      this.surveyUnderWork.revisions.push(nextVersionObj);
      this.surveyUnderWork.meta.dateModified = date;
    },
    addToLibrary() {
      this.surveyUnderWork.meta.isLibrary = true;
      this.saveDraft();
    },
    async addQuestionsFromLibrary(librarySurveyId) {
      // load library survey
      const { data: librarySurvey } = await api.get(`/surveys/${librarySurveyId}?version=latest`);
      // add resources from library survey
      const newResources = getPreparedLibraryResources(librarySurvey);

      // prepare root group for the library questions to be inserted into
      let rootGroup = createControlInstance(availableControls.find((c) => c.type === 'group'));
      rootGroup.name = slugify(librarySurvey.name);
      rootGroup.label = librarySurvey.name;
      rootGroup.isLibraryRoot = true;
      rootGroup.libraryId = librarySurvey._id;
      rootGroup.libraryVersion = librarySurvey.latestVersion;
      this.controlAdded(rootGroup);

      // add questions from library survey to question group
      rootGroup.children = getPreparedLibraryControls(
        librarySurvey._id,
        librarySurvey.latestVersion,
        librarySurvey.revisions.find((revision) => revision.version === librarySurvey.latestVersion).controls,
        newResources,
        null
      );
      // update the survey resources
      this.updateLibraryResources(newResources);
      // hide the library view
      this.showLibrary = false;
    },
    async updateLibrary(updateLibraryRootGroup) {
      this.updateLibraryRootGroup = updateLibraryRootGroup;
      const { data } = await api.get(`/surveys/${updateLibraryRootGroup.libraryId}?version=all`);
      this.updateToLibrary = data;
      this.updateLibraryDialogIsVisible = true;
    },
    updateLibraryConfirmed(updatedLibraryControls) {
      this.updateLibraryRootGroup.libraryVersion = this.updateToLibrary.latestVersion;
      //update resources
      const updatedResources = getPreparedLibraryResources(this.updateToLibrary);
      // add updated controls, prepared by creating new id's, setting origin and update resources references
      this.updateLibraryRootGroup.children = getPreparedLibraryControls(
        this.updateToLibrary._id,
        this.updateToLibrary.latestVersion,
        updatedLibraryControls,
        updatedResources,
        this.surveyUnderWork.resources
      );
      // update the survey resources
      this.updateLibraryResources(updatedResources);
      //clear update vars
      this.updateToLibrary = null;
      this.updateLibraryRootGroup = null;
      this.updateLibraryDialogIsVisible = false;
    },
    updateLibraryCancelled() {
      this.updateToLibrary = null;
      this.updateLibraryDialogIsVisible = false;
      this.updateLibraryRootGroup = null;
    },
    updateLibraryResources(newLibraryResources) {
      // add updated resources
      this.surveyUnderWork.resources = this.surveyUnderWork.resources.concat(newLibraryResources);
      // remove library resources which are not used anymore (e.g. this could happen if resources with same origin are added when consuming the same library multiple times)
      this.cleanupLibraryResources();
    },
    cleanupScriptRefResources() {
      const controls = this.surveyUnderWork.revisions[this.surveyUnderWork.revisions.length - 1].controls;
      this.surveyUnderWork.resources = this.surveyUnderWork.resources.filter(
        (resource) => resource.type !== resourceTypes.SCRIPT_REFERENCE || isResourceReferenced(controls, resource.id)
      );
    },
    cleanupSurveyRefResources() {
      const controls = this.surveyUnderWork.revisions[this.surveyUnderWork.revisions.length - 1].controls;
      this.surveyUnderWork.resources = this.surveyUnderWork.resources.filter(
        (resource) => resource.type !== resourceTypes.SURVEY_REFERENCE || isResourceReferenced(controls, resource.id)
      );
    },
    cleanupLibraryResources() {
      const controls = this.surveyUnderWork.revisions[this.surveyUnderWork.revisions.length - 1].controls;
      this.surveyUnderWork.resources = this.surveyUnderWork.resources.filter(
        (resource) => !resource.libraryId || isResourceReferenced(controls, resource.id)
      );
    },
    closeLibrary() {
      this.showLibrary = false;
    },
    async checkForLibraryUpdates(survey) {
      const { data } = await api.get(`/surveys/check-for-updates/${survey._id}`);
      this.availableLibraryUpdates = data;
    },
    initDirtyFlag(survey) {
      if (!survey.revisions) {
        this.dirty = false;
      } else if (survey.revisions.length === 1 && !this.editMode) {
        this.dirty = true;
      } else {
        const len = survey.revisions.length;
        this.dirty = survey.revisions[len - 1].version !== survey.latestVersion;
      }

      if (
        !this.dirty &&
        !isEqualWith(survey.revisions, this.initialSurvey.revisions, (value1, value2, key) =>
          key === 'label' ? true : undefined
        )
      ) {
        this.createDraft();
      }

      let version = this.dirty ? `${survey.latestVersion + 1} (draft)` : survey.latestVersion;
      if (!this.editMode && survey.revisions.length === 1) {
        version = 1;
      }

      this.version = version;
    },
    updateSelectedCode(code) {
      this.control.options[tabMap[this.selectedTab]].code = code;
      this.activeCode = code;
    },
    highlightNext() {
      [
        this.optionsRelevance,
        this.optionsInitialize,
        this.optionsCalculate,
        this.optionsConstraint,
        this.optionsApiCompose,
      ]
        .filter((o) => o !== undefined)
        .forEach((item, idx) => {
          if (item.enabled) {
            this.selectedTab = idx;
          }
        });
    },
    highlight(tab, select = true) {
      this.codeError = null;
      this.evaluated = null;

      this.hideCode = false;

      //ealry leave in case of a missing option
      if (!this.control.options[tab]) {
        return;
      }

      if (!this.control.options[tab].enabled) {
        this.highlightNext();
        return;
      }

      this.selectedTab = tabMap.indexOf(tab);

      if (!this.control.options[tab].code) {
        let initialCode;
        if (tab === 'apiCompose') {
          initialCode = defaultApiCompose;
        } else if (tab === 'initialize') {
          initialCode = initialInitializeCode(tab);
        } else {
          initialCode = initialRelevanceCode(tab);
        }

        this.control.options[tab].code = initialCode;
        this.activeCode = initialCode;
      } else {
        this.activeCode = this.control.options[tab].code;
      }
    },
    async runCode() {
      const tab = tabMap[this.selectedTab];
      try {
        const res = await executeUnsafe({
          code: this.activeCode,
          fname: tab,
          submission: this.instance,
          survey: this.surveyUnderWork,
          parent: this.parent,
          log: (arg) => {
            this.log = `${this.log}${arg}\n`;
          },
        });
        if (tab === 'apiCompose') {
          if (typeof res !== 'object') {
            throw Error('Function must return an object');
          }
        } else if (tab === 'initialize') {
          if (this.control.type === 'matrix' && res !== null && !Array.isArray(res)) {
            throw Error('Function must return row data in an array ( [ ] )');
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
      this.closeLibrary();
      this.control = control;
      if (control && control.type === 'script' && control.options.source) {
        const scriptResource = this.surveyUnderWork.resources.find((r) => r.id === control.options.source);
        let scriptId;
        if (scriptResource) {
          scriptId = scriptResource.content;
        } else {
          //fallback to directly using script id in case of legacy survey
          scriptId = control.options.source;
        }
        const data = await this.fetchScript(scriptId);
        this.scriptEditorIsVisible = false;
        this.setScriptCode(data);
      } else {
        this.scriptCode = null;
      }
    },
    async controlRemoved() {
      await this.controlSelected(null);
      this.cleanupLibraryResources();
      this.cleanupScriptRefResources();
      this.cleanupSurveyRefResources();
    },
    async fetchScript(id) {
      const { data } = await api.get(`/scripts/${id}`);
      return data;
    },
    setScriptCode(data) {
      if (!data) {
        // default empty script...
        // ideally we shouldn't need to instantiate inside SurveyBuilder
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
    success(msg) {
      if (this.timeoutID) {
        clearTimeout(this.timeoutID);
      }
      window.scrollTo(0, 0);
      setTimeout(() => {
        this.successMessage = null;
        this.timeoutID = null;
      }, 15000);
      this.successMessage = msg;
      this.errorMessage = null;
    },
    error(msg) {
      if (this.timeoutID) {
        clearTimeout(this.timeoutID);
      }
      this.errorMessage = msg;
      this.successMessage = null;
      window.scrollTo(0, 0);
      this.timeoutID = setTimeout(() => {
        this.errorMessage = null;
        this.timeoutID = null;
      }, 15000);
    },
    updateSurvey(controls) {
      this.surveyUnderWork.revisions[this.surveyUnderWork.revisions.length - 1].controls = controls;
    },
    duplicateControl(control) {
      if (this.control && this.currentControls.length > 0) {
        const position = getPosition(this.control, this.currentControls);
        insertControl(
          control,
          this.currentControls,
          position,
          this.control.type === 'group' || this.control.type === 'page'
        );
      } else {
        insertControl(control, this.currentControls, 0, false);
      }
      this.control = control;
    },
    hideControl(control) {
      this.controlSelected(control);
      this.control.options.hidden = true;
    },
    unhideControl(control) {
      this.controlSelected(control);
      this.control.options.hidden = undefined;
    },
    controlAdded(control) {
      if (!this.control) {
        this.currentControls.push(control);
        this.control = control;
        return;
      }

      const position = getPosition(this.control, this.currentControls);
      insertControl(
        control,
        this.currentControls,
        position,
        this.control.type === 'group' || this.control.type === 'page'
      );
      this.control = control;
      this.showLibrary = false;
    },
    openLibrary(libraryId) {
      this.showLibrary = true;
      if (libraryId) {
        this.libraryId = libraryId;
      } else {
        this.libraryId = null;
      }
    },
    toggleLibrary(libraryId) {
      if (this.showLibrary) {
        this.closeLibrary();
      } else {
        this.openLibrary(libraryId);
      }
    },
    async setControlSource(value) {
      if (this.control.type === 'script') {
        const data = await this.fetchScript(value.id);
        this.setScriptCode(data);
        //create new script reference resource
        const label = 'Script Reference ' + value.name;
        let newResource = {
          id: new ObjectId().toString(),
          label: label,
          name: slugify(label) + '_' + value.id,
          type: resourceTypes.SCRIPT_REFERENCE,
          location: resourceLocations.REMOTE,
          content: value.id,
        };
        //update survey resources
        const newResources = setResource(this.surveyUnderWork.resources, newResource);
        this.setSurveyResources(newResources);
        //store resource id to the script's source
        this.control.options.source = newResource.id;
        //clean up unused script references
        this.cleanupScriptRefResources();
        this.cleanupSurveyRefResources();
      } else {
        this.control.options.source = value;
      }
    },
    setSurveyResources(resources) {
      //TODO do not mutate survey prop
      this.surveyUnderWork.resources = resources;
    },
    setControlParams(params) {
      this.control.options.params = params;
    },
    validateSurveyName() {
      return !!this.surveyUnderWork.name && /^[\w-\s]{5,}$/.test(this.surveyUnderWork.name)
        ? true
        : 'Survey name is invalid';
    },
    validateSurveyQuestions() {
      const namePattern = /^[\w-]{1,}$/; // one character should be ok, especially within groups
      const currentControls = this.surveyUnderWork.revisions[this.surveyUnderWork.revisions.length - 1].controls;
      const uniqueNames = uniqBy(currentControls, 'name');
      const hasOnlyUniqueNames = uniqueNames.length === currentControls.length;
      const allNamesContainOnlyValidCharacters = !currentControls.some((control) => !namePattern.test(control.name));

      const groupedQuestionsAreValid = getGroups(currentControls).reduce((r, group) => {
        const uniqueNamesInGroup = uniqBy(group.children, 'name');
        const groupHasOnlyUniqueNames = uniqueNamesInGroup.length === group.children.length;
        const allNamesInGroupContainOnlyValidCharacters = !group.children.some(
          (control) => !namePattern.test(control.name)
        );
        return r && groupHasOnlyUniqueNames && allNamesInGroupContainOnlyValidCharacters;
      }, true);

      return hasOnlyUniqueNames && allNamesContainOnlyValidCharacters && groupedQuestionsAreValid
        ? true
        : 'Questions list contains an invalid data name';
    },
    createInstance() {
      const { version } = this.surveyUnderWork.revisions[this.surveyUnderWork.revisions.length - 1];

      this.instance = createSubmissionFromSurvey({
        survey: this.surveyUnderWork,
        version,
        instance: this.instance,
        isDraft: false,
      });
    },
  },
  computed: {
    scriptIsSavable() {
      if (this.control.type !== 'script') {
        return false;
      }
      const scriptIsInQSL = Boolean(this.control.libraryId);
      const scriptInQSLIsModifiable = this.control.options.allowModify;
      const scriptIsInSameGroupAsSurvey = this.$route.params.id === this.scriptCode.meta.group.id;
      // check that user is admin of script's group or one of it's ancestors
      const scriptPath = this.scriptCode.meta.group.path;
      const roles = this.$store.getters['memberships/memberships'].map((m) => `${m.role}@${m.group.path}`);
      const targetRole = `admin@${scriptPath}`;
      const userHasPermissionToSaveScript = roles.some((role) => targetRole.startsWith(role));
      if (scriptIsInQSL) {
        return scriptInQSLIsModifiable && userHasPermissionToSaveScript && scriptIsInSameGroupAsSurvey;
      }
      return userHasPermissionToSaveScript && scriptIsInSameGroupAsSurvey;
    },
    surveyIsValid() {
      // return this.invalidValidations.length > 0 ? invalidValidations : true;
      return !(this.surveyValidationErrors.length > 0) && this.validateSurveyName() === true;
    },
    surveyValidationErrors() {
      const validations = [this.validateSurveyQuestions()];
      return validations.filter((validation) => validation !== true);
    },
    enableDismissDraft() {
      return this.isDraft;
    },
    isDraft() {
      const len = this.surveyUnderWork.revisions.length;

      if (!this.surveyUnderWork.revisions || len === 0) {
        return false;
      }

      return this.surveyUnderWork.revisions[len - 1].version !== this.surveyUnderWork.latestVersion;
    },
    enableUpdate() {
      if (!this.surveyIsValid) {
        return false;
      }

      if (this.isDraft) {
        return false;
      }
      if (
        this.initialSurvey.name !== this.surveyUnderWork.name ||
        this.initialSurvey.description !== this.surveyUnderWork.description ||
        this.initialSurvey.meta.submissions !== this.surveyUnderWork.meta.submissions
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

      if (!this.editMode) {
        // if survey new
        if (this.initialSurvey.name !== this.surveyUnderWork.name) {
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
        if (this.initialSurvey.name !== this.surveyUnderWork.name) {
          return true;
        }
      }

      return this.dirty;
    },
    controlId() {
      const position = getPosition(this.control, this.currentControls);
      const id = getFlatName(this.currentControls, position);
      return id;
    },
    hasCode() {
      if (!this.control) {
        return false;
      }
      return (
        this.control.options.relevance.enabled ||
        this.control.options.initialize.enabled ||
        this.control.options.calculate.enabled ||
        this.control.options.constraint.enabled ||
        this.control.options.apiCompose.enabled
      );
    },
    hasScript() {
      if (!this.control) {
        return false;
      }
      return this.control.type === 'script';
    },
    currentVersion() {
      return this.surveyUnderWork.revisions[this.surveyUnderWork.revisions.length - 1].version;
    },
    currentControls() {
      return this.surveyUnderWork.revisions[this.surveyUnderWork.revisions.length - 1].controls;
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
      const position = getPosition(this.control, this.currentControls);
      const path = getFlatName(this.currentControls, position);
      const parentPath = getParentPath(path);
      const parentData = get(this.instance, parentPath);
      return parentData;
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
    optionsInitialize: {
      handler(newVal) {
        if (!newVal) {
          return;
        }
        this.highlight('initialize', newVal.enabled);
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
          console.log('handler(newval): newVal is undef');
          this.optionsRelevance = null;
          this.optionsInitialize = null;
          this.optionsCalculate = null;
          this.optionsConstraint = null;
          this.optionsApiCompose = null;
          return;
        }

        //heal missing expression options
        !newVal.options.relevance ? (newVal.options.relevance = cloneDeep(emptyOptions)) : undefined;
        !newVal.options.initialize ? (newVal.options.initialize = cloneDeep(emptyOptions)) : undefined;
        !newVal.options.calculate ? (newVal.options.calculate = cloneDeep(emptyOptions)) : undefined;
        !newVal.options.constraint ? (newVal.options.constraint = cloneDeep(emptyOptions)) : undefined;
        !newVal.options.apiCompose ? (newVal.options.apiCompose = cloneDeep(emptyOptions)) : undefined;

        this.optionsRelevance = newVal.options.relevance;
        this.optionsInitialize = newVal.options.initialize;
        this.optionsCalculate = newVal.options.calculate;
        this.optionsConstraint = newVal.options.constraint;
        this.optionsApiCompose = newVal.options.apiCompose;
      },
      deep: true,
    },
    survey: {
      handler(newVal) {
        this.initDirtyFlag(newVal);
        if (!this.initialSurvey || !this.surveyUnderWork) {
          this.surveyUnchanged = true;
        }

        const resourcesAreEqual = isEqual(this.initialSurvey.resources, newVal.resources);
        const revisionsAreEqual = isEqual(this.initialSurvey.revisions, newVal.revisions);
        const surveyDetailsAreEquivalent =
          this.initialSurvey.name === newVal.name &&
          this.initialSurvey.description === newVal.description &&
          isEqual(this.initialSurvey.meta.group, newVal.meta.group) &&
          isEqual(this.initialSurvey.meta.printOptions, newVal.meta.printOptions);
        this.surveyUnchanged = revisionsAreEqual && surveyDetailsAreEquivalent && resourcesAreEqual;

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
    this.initDirtyFlag(this.surveyUnderWork);
    this.createInstance();
    this.checkForLibraryUpdates(this.surveyUnderWork);

    // case question set to new survey from question sets list
    const { libId, lib } = this.$route.query;
    if (lib) {
      this.surveyUnderWork.meta.isLibrary = true;
      this.surveyUnderWork.meta.libraryDescription = '';
      this.surveyUnderWork.meta.libraryApplications = '';
      this.surveyUnderWork.meta.libraryMaintainers = '';
      this.surveyUnderWork.meta.libraryHistory = '';
      this.surveyUnderWork.meta.libraryLastChangeType = '';
    } else if (libId) this.addQuestionsFromLibrary(libId);
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

<style>
.pane-root .splitpanes__splitter {
  background-color: #eee;
}
</style>

<style scoped lang="scss">
.screen-root {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.pane-root {
  min-width: 100%;
  height: 100%;
  padding: 0;
}

.pane {
  will-change: transform;
  transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  height: calc(100vh - 64px - 30px - 24px);
  min-width: 400px;
  max-height: 100%;
  margin: 15px;
  margin-bottom: 0px;
  overflow: hidden;
  flex-shrink: 0;
}

.pane-survey,
.pane-controls {
  overflow: auto;
  width: 500px !important;
}

.pane-library {
  overflow: auto;
  width: 1000px !important;
  border-style: solid !important;
  border-width: 5px !important;
  border-color: #4caf50 !important;
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

.pane-draft {
  width: 100vw;
  align-self: center;
  margin: 15px 60px;
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
  -webkit-transition:
    width 0.2s ease-out,
    height 0.2s ease-out;
  transition:
    width 0.2s ease-out,
    height 0.2s ease-out;
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
  content: '';
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

#previewSurvey > .v-dialog__content.v-dialog__content--active {
  border-color: rgba(33, 33, 33, 0.46);
  background-color: rgba(33, 33, 33, 0.46);
  pointer-events: all;
}
</style>
