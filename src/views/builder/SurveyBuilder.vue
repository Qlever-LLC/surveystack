<template>
  <div>
    <div
      dark
      class="blue-grey darken-2"
      :class="{ 'editor-visible': showCodeEditor, 'editor-hidden' : !showCodeEditor }"
      id="builder-editor"
    >
      <monaco-editor v-if="survey" :survey="instance" style="height: 100%"></monaco-editor>

    </div>
    <div
      id="builder-container"
      :class="{ 'builder-container-squeeze': showCodeEditor}"
    >
      <v-container>
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

        <v-row>
          <v-col cols="7">
            <div class="mb-2 d-flex justify-space-between align-center">
              <v-btn
                @click="viewCode = !viewCode"
                color="primary"
                small
                text
              >{{ viewCode ? "graphical" : "code"}}</v-btn>
            </div>

            <graphical-view
              v-if="!viewCode"
              :selected="control"
              :controls="currentControls"
              @controlSelected="controlSelected"
            />
            <code-view
              style="font-family: monospace;"
              v-else
              v-model="survey"
            />
          </v-col>
          <v-col cols="5">
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
          </v-col>
        </v-row>
      </v-container>
    </div>

  </div>
</template>

<script>
import _ from 'lodash';
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';

import monacoEditor from '@/components/ui/Editor.vue';
import graphicalView from '@/components/builder/GraphicalView.vue';
import codeView from '@/components/builder/CodeView.vue';
import controlProperties from '@/components/builder/ControlProperties.vue';
import controlAdder from '@/components/builder/ControlAdder.vue';
import surveyDetails from '@/components/builder/SurveyDetails.vue';
import appMixin from '@/components/mixin/appComponent.mixin';

import appDialog from '@/components/ui/Dialog.vue';

import * as utils from '@/utils/surveys';

const currentDate = new Date();


export default {
  mixins: [
    appMixin,
  ],
  components: {
    monacoEditor,
    graphicalView,
    codeView,
    controlProperties,
    controlAdder,
    surveyDetails,
    appDialog,
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
        this.instance = utils.codeFromSubmission(utils.createInstance(newVal, newVal.latestVersion));
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
  max-height: calc(100% - 64px);
}

.editor-visible {
  transform: translateX(0);
}

.editor-hidden {
  transform: translateX(100%);
}
</style>
