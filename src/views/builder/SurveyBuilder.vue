<template>
  <multipane
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
          <h3>Add questions</h3>
          <control-adder @controlAdded="controlAdded" />
          <h3>Properties</h3>
          <control-properties
            :toggleCode="toggleCodeEditor"
            :control="control"
            :survey="survey"
          />
        </div>
      </v-card>
    </div>
    <multipane-resizer />
    <div class="pane pane-main-code">

      <div
        class="code-editor"
        :class="{ 'editor-visible': showCodeEditor, 'editor-hidden' : !showCodeEditor }"
      >
        <code-editor
          title="Relevance"
          v-if="survey"
          class="code-editor"
          :refresh="codeRefreshCounter"
        ></code-editor>

      </div>
    </div>
    <multipane-resizer />
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
  </multipane>
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

import appMixin from '@/components/mixin/appComponent.mixin';

import appDialog from '@/components/ui/Dialog.vue';

import * as utils from '@/utils/surveys';

const currentDate = new Date();


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
  },
  data() {
    return {
      // modes
      showCodeEditor: true,
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
        await api.customRequest({ method, url, data: this.survey });
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
      this.submissionCode = `const survey = ${JSON.stringify(utils.codeFromSubmission(this.instance), null, 4)}`;
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
.pane-root {
  width: 100%;
  height: 90%;
  max-height: 90%;
  overflow: auto;
}

.pane-root > .pane ~ .pane {
  border-left: 1px solid #eee;
}
.pane {
  overflow: hidden;
  padding: 12px;
  max-width: 50%;
  position: initial;
}

.pane-survey {
  min-width: 400px;
  height: 90%;
  max-height: 90%;
  overflow: auto;
}

.graphical-view {
  overflow: auto;
  max-height: 100%;
}

.pane-main-code,
.pane-submission-code {
  min-width: 400px;
}

.pane-draft {
  flex-grow: 1;
  position: relative;
  min-width: 400px;
}

.no-outline {
  outline: none;
}

#builder-container {
  overflow-y: auto;
  position: fixed;
  height: calc(100% - 56px);
  padding-top: 0px !important;
  padding-bottom: 0px !important;
  margin-top: 0px !important;
  margin-bottom: 0px !important;
  left: 0;
  right: 0;

  will-change: transform;
  transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.builder-container-squeeze {
  right: calc(48px + 50vw) !important;
}

#builder-editor {
  width: 50vw;
  position: fixed;
  top: 64px;
  right: 0;
  bottom: 0;
  will-change: transform;
  transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  height: calc(100% - 64px);
  max-height: calc(100% - 64px);
}

.code-editor {
  height: 100%;
}

.editor-visible {
  transform: translateX(0);
}

.editor-hidden {
  transform: translateX(100%);
}
</style>
