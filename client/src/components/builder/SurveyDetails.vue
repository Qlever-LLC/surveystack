<template>
  <v-card>
    <v-card-title class="d-block pb-0">
      <div class="d-flex">
        <survey-name-editor v-model="value.name" />
        <v-spacer />
        <v-dialog v-model="editDetailsDialogIsVisible" width="500" max-width="75%">
          <template v-slot:activator="{ on }">
            <v-btn icon v-on="on">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-title> Edit Survey Details</v-card-title>
            <v-card-text>
              <active-group-selector class="my-4" label="Group" v-model="value.meta.group" outlined returnObject />
              <v-select
                outlined
                v-model="value.meta.submissions"
                label="Allow Submissions for..."
                :items="availableSubmissions"
              />
              <v-textarea v-model="value.description" label="Description" class="mt-4" rows="4" outlined />
            </v-card-text>
            <v-card-actions class="mr-3">
              <v-spacer />
              <v-btn @click="editDetailsDialogIsVisible = false" color="primary" text> Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-dialog v-model="resourcesDialogIsVisible" width="800" max-width="80%">
          <template v-slot:activator="{ on }">
            <v-btn icon v-on="on">
              <v-icon>mdi-dresser</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-title> Survey Resources</v-card-title>
            <v-card-text>
              <app-resources
                :resources="survey.resources"
                @set-survey-resources="(val) => $emit('set-survey-resources', val)"
              />
            </v-card-text>
            <v-card-actions class="mr-3">
              <v-spacer />
              <v-btn @click="resourcesDialogIsVisible = false" color="primary" text> Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <publish-updated-library-dialog
          v-if="updateLibraryDialogIsVisible"
          v-model="updateLibraryDialogIsVisible"
          :library-survey="librarySurveyPublishedAndDraft"
          @ok="publishUpdateToLibrary"
          @cancel="updateLibraryDialogIsVisible = false"
        />
        <a-menu offset-y left>
          <template v-slot:activator="{ on }">
            <v-btn icon v-on="on">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item class="d-flex align-center">
              <v-list-item-title>
                <a-input hide-details>
                  <label for="select-items-file-input-surveydetails" class="cursor-pointer">
                    <v-btn class="pointer-events-none" text>
                      <v-icon color="grey">mdi-file-upload</v-icon>
                      <div class="ml-1">Import</div>
                    </v-btn>
                  </label>
                  <input
                    type="file"
                    id="select-items-file-input-surveydetails"
                    ref="select-items-file-input-surveydetails"
                    accept=".json"
                    class="d-none"
                    @change="(file) => $emit('import-survey', file)"
                  />
                </a-input>
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>
                <v-btn @click="$emit('export-survey')" text>
                  <v-icon color="grey">mdi-file-download</v-icon>
                  <div class="ml-1">Export</div>
                </v-btn>
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>
                <v-btn @click="$emit('show-version-dialog')" text>
                  <v-icon color="grey">mdi-sitemap</v-icon>
                  <div class="ml-1">Manage Survey Versions</div>
                </v-btn>
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>
                <v-btn @click="editLibraryDialogIsVisible = true" text>
                  <v-icon color="grey">mdi-library</v-icon>
                  <div class="ml-1">{{ value.meta.isLibrary ? 'Edit library data' : 'Add to library' }}</div>
                </v-btn>
              </v-list-item-title>
            </v-list-item>
            <v-list-item v-if="value.meta.isLibrary">
              <v-list-item-title>
                <v-btn @click="libraryConsumersDialogIsVisible = true" text>
                  <v-icon color="grey">mdi-layers-search</v-icon>
                  <div class="ml-1">List library consumers</div>
                </v-btn>
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>
                <v-btn text @click="printSettingDialogIsVisible = true">
                  <v-icon color="grey">mdi-printer-settings</v-icon>
                  <div class="ml-1">Print settings</div>
                </v-btn>
              </v-list-item-title>
            </v-list-item>
            <v-list-item v-if="!isNew">
              <v-list-item-title>
                <v-btn text @click="$emit('delete')">
                  <v-icon color="grey">mdi-delete</v-icon>
                  <div class="ml-1">Delete</div>
                </v-btn>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </a-menu>
        <edit-library-dialog
          v-if="editLibraryDialogIsVisible"
          v-model="editLibraryDialogIsVisible"
          :library-survey="value"
          @ok="addToLibrary"
          @cancel="editLibraryDialogIsVisible = false"
        />
        <list-library-consumers-dialog
          v-if="libraryConsumersDialogIsVisible"
          v-model="libraryConsumersDialogIsVisible"
          :library-survey="value"
          @cancel="libraryConsumersDialogIsVisible = false"
        />
        <print-settings-dialog v-model="printSettingDialogIsVisible" :survey="survey" />
      </div>
      <div class="d-flex justify-space-between align-center mt-n1">
        <div class="body-2 grey--text caption">
          Size: {{ surveySize }} MB
          <v-btn
            v-if="surveySize > 1"
            @click="$emit('show-version-dialog')"
            x-small
            color="white"
            elevation="0"
            class="mb-1"
          >
            <v-icon x-small color="warning">mdi-alert</v-icon>try to clean up
          </v-btn>
        </div>
        <div class="text-left">
          <a-chip dark small outlined color="grey"> Version {{ version }}</a-chip>
        </div>
      </div>
    </v-card-title>
    <v-card-text>
      <div class="mt-4">
        <v-text-field
          :value="surveyGroupName"
          label="Group"
          readonly
          disabled
          dense
          hide-details
          class="mb-2 survey-group-name-input"
        />
        <div class="d-flex flex-wrap justify-end align-center">
          <v-tooltip bottom v-if="!isNew">
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-btn
                  v-if="!isNew"
                  :dark="enableUpdate"
                  :disabled="!enableUpdate || isSaving"
                  :loading="isUpdating"
                  @click="$emit('update')"
                  color="primary"
                  class="my-1 mr-1"
                >
                  <v-icon class="mr-1">mdi-update</v-icon>
                  Update
                </v-btn>
              </div>
            </template>
            <span
              >Override an existing <strong>published</strong> Survey.
              <br />
              Updating is only possible <em>only</em> when changing Labels of a Question.</span
            >
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-btn
                  :dark="enablePublish"
                  class="my-1 mr-1"
                  @click="publish"
                  color="green"
                  :disabled="!enablePublish"
                >
                  <v-icon class="mr-1">mdi-cloud-upload</v-icon>
                  Publish
                </v-btn>
              </div>
            </template>

            <span>Publish current version of Survey to users</span>
          </v-tooltip>

          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-btn
                  :dark="enableSaveDraft"
                  @click="$emit('saveDraft')"
                  color="primary"
                  :disabled="!enableSaveDraft || isUpdating"
                  :loading="isSaving"
                  class="my-1 mr-1"
                >
                  <v-icon class="mr-1">mdi-content-save</v-icon>
                  Save
                </v-btn>
              </div>
            </template>
            <span>Save a new draft <strong>version</strong> of the Survey</span>
          </v-tooltip>
        </div>
      </div>

      <v-tooltip bottom v-if="validationErrors.length > 0">
        <template v-slot:activator="{ on }">
          <v-alert type="error" colored-border border="left" class="mt-2" elevation="2" v-on="on">
            Survey contains errors
          </v-alert>
        </template>
        <div v-for="error in validationErrors" :key="error">
          {{ error }}
        </div>
      </v-tooltip>
    </v-card-text>
  </v-card>
</template>

<script>
import SurveyNameEditor from '@/components/builder/SurveyNameEditor.vue';
import ActiveGroupSelector from '@/components/shared/ActiveGroupSelector.vue';
import appResources from '@/components/builder/Resources.vue';
import { getGroupNameById } from '@/utils/groups';
import EditLibraryDialog from '@/components/survey/library/EditLibraryDialog';
import PublishUpdatedLibraryDialog from '@/components/survey/library/PublishUpdatedLibraryDialog';
import ListLibraryConsumersDialog from '@/components/survey/library/ListLibraryConsumersDialog';
import PrintSettingsDialog from './SurveyPrintSettingsDialog.vue';
import { calcSurveySizeMB } from '@/utils/surveys';
import api from '@/services/api.service';

const availableSubmissions = [
  { value: 'public', text: 'Everyone' },
  { value: 'user', text: 'Logged in users' },
  { value: 'group', text: 'Group members' },
];

export default {
  data() {
    return {
      resourcesDialogIsVisible: false,
      editDetailsDialogIsVisible: false,
      editLibraryDialogIsVisible: false,
      updateLibraryDialogIsVisible: false,
      libraryConsumersDialogIsVisible: false,
      printSettingDialogIsVisible: false,
      surveyGroupName: 'Group Not Found',
      librarySurveyPublishedAndDraft: null,
      availableSubmissions,
    };
  },
  async created() {
    const { id } = this.value.meta.group;
    if (id) {
      const name = await this.getGroupNameById(id);
      this.surveyGroupName = name;
    }
  },
  props: [
    'survey',
    'value',
    'isNew',
    'isSaving',
    'isUpdating',
    'dirty',
    'enableUpdate',
    'enableSaveDraft',
    'enablePublish',
    'enableDismissDraft',
    'version',
    'validationErrors',
  ],
  computed: {
    surveySize() {
      return calcSurveySizeMB(this.survey);
    },
  },
  watch: {
    value: {
      async handler(value) {
        if (value.meta.group && value.meta.group.id) {
          this.surveyGroupName = await this.getGroupNameById(value.meta.group.id);
        }
      },
      deep: true,
    },
  },
  components: {
    ListLibraryConsumersDialog,
    PublishUpdatedLibraryDialog,
    EditLibraryDialog,
    PrintSettingsDialog,
    SurveyNameEditor,
    ActiveGroupSelector,
    appResources,
  },
  methods: {
    async getGroupNameById(id) {
      return await getGroupNameById(id);
    },
    async publish() {
      if (this.value.meta.isLibrary) {
        //add published revision to the survey as published and draft versions are needed to show diffs
        const { data } = await api.get(`/surveys/${this.value._id}?version=latest`);
        this.librarySurveyPublishedAndDraft = this.value;
        this.librarySurveyPublishedAndDraft.revisions.unshift(data.revisions.pop());
        //show update library dialog, ask for release notes
        this.updateLibraryDialogIsVisible = true;
      } else {
        this.$emit('publish');
      }
    },
    publishUpdateToLibrary() {
      this.$emit('publish');
    },
    updateSurveyName(name) {
      this.$emit('set-survey-name', name);
      // this.$set(this.value, 'name', name);
    },
    updateSurveyGroup({ _id }) {
      this.$emit('set-survey-group', _id);
      // this.$set(this.value, 'group', _id);
    },
    updateSurveyDescription(description) {
      this.$emit('set-survey-description', description);
      // this.$set(this.value, 'description', description);
    },
    addToLibrary(library) {
      this.value = library;
      this.$emit('addToLibrary');
      this.editLibraryDialogIsVisible = false;
    },
  },
};
</script>

<style scoped>
.pointer-events-none {
  pointer-events: none !important;
}

.cursor-pointer {
  cursor: pointer;
}

.survey-group-name-input >>> .v-input__slot ::before {
  border: none;
}

.survey-group-name-input
  >>> .theme--light.v-text-field.v-input--is-disabled
  > .v-input__control
  > .v-input__slot:before {
  border: none;
}

.survey-group-name-input >>> .v-input__control >>> .v-input__slot ::before {
  border: none;
}
</style>
