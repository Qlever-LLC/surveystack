<template>
  <a-card>
    <a-card-title class="d-block py-0">
      <div class="d-flex">
        <AppNavigationControl class="align-self-center mr-2 ml-n4 mt-n4" />
        <survey-name-editor v-model="value.name" />
        <a-spacer />
        <a-dialog v-model="editDetailsDialogIsVisible" width="500" max-width="75%">
          <template v-slot:activator="{ props }">
            <a-btn icon v-bind="props">
              <a-icon>mdi-cog</a-icon>
            </a-btn>
          </template>
          <a-card>
            <a-card-title>Survey Settings</a-card-title>
            <a-card-text>
              <group-selector class="my-4" label="Group" v-model="value.meta.group" outlined returnObject />
              <a-select
                variant="outlined"
                v-model="value.meta.submissions"
                label="Allow Responses for..."
                :items="availableSubmissions"
                item-title="text"
                item-value="value" />
              <a-checkbox label="Show submission review page at end of survey" v-model="value.meta.reviewPage" />
              <a-textarea v-model="value.description" label="Description" class="mt-4" rows="4" variant="outlined" />
            </a-card-text>
            <a-card-actions class="mr-3">
              <a-spacer />
              <a-btn @click="editDetailsDialogIsVisible = false" color="primary" variant="text"> Close</a-btn>
            </a-card-actions>
          </a-card>
        </a-dialog>
        <a-dialog v-model="resourcesDialogIsVisible" width="800" max-width="80%">
          <template v-slot:activator="{ props }">
            <a-btn icon v-bind="props">
              <a-icon>mdi-dresser</a-icon>
            </a-btn>
          </template>
          <a-card>
            <a-card-title> Survey Resources</a-card-title>
            <a-card-text>
              <app-resources
                :resources="survey.resources"
                @set-survey-resources="(val) => $emit('set-survey-resources', val)" />
            </a-card-text>
            <a-card-actions class="mr-3">
              <a-spacer />
              <a-btn @click="resourcesDialogIsVisible = false" color="primary" variant="text"> Close</a-btn>
            </a-card-actions>
          </a-card>
        </a-dialog>
        <publish-updated-library-dialog
          v-if="updateLibraryDialogIsVisible"
          v-model="updateLibraryDialogIsVisible"
          :library-survey="librarySurveyPublishedAndDraft"
          @ok="publishUpdateToLibrary"
          @cancel="updateLibraryDialogIsVisible = false" />
        <a-menu location="bottom" v-model="menuIsOpen">
          <template v-slot:activator="{ props }">
            <a-btn icon v-bind="props">
              <a-icon>mdi-dots-vertical</a-icon>
            </a-btn>
          </template>
          <a-list>
            <a-list-item class="d-flex align-center">
              <a-list-item-title>
                <a-input hide-details>
                  <label for="select-items-file-input-surveydetails" class="cursor-pointer">
                    <a-btn class="pointer-events-none" variant="text">
                      <a-icon color="grey">mdi-file-upload</a-icon>
                      <div class="ml-1">Import</div>
                    </a-btn>
                  </label>
                  <input
                    type="file"
                    id="select-items-file-input-surveydetails"
                    ref="select-items-file-input-surveydetails"
                    accept=".json"
                    class="d-none"
                    @change="(file) => $emit('import-survey', file)" />
                </a-input>
              </a-list-item-title>
            </a-list-item>
            <a-list-item>
              <a-list-item-title>
                <a-btn @click="$emit('export-survey')" variant="text">
                  <a-icon color="grey">mdi-file-download</a-icon>
                  <div class="ml-1">Export</div>
                </a-btn>
              </a-list-item-title>
            </a-list-item>
            <a-list-item>
              <a-list-item-title>
                <a-btn @click="$emit('show-version-dialog')" variant="text">
                  <a-icon color="grey">mdi-sitemap</a-icon>
                  <div class="ml-1">Manage Survey Versions</div>
                </a-btn>
              </a-list-item-title>
            </a-list-item>
            <a-list-item>
              <a-list-item-title>
                <a-btn @click="editLibraryDialogIsVisible = true" variant="text">
                  <a-icon color="grey">mdi-library</a-icon>
                  <div class="ml-1">{{ value.meta.isLibrary ? 'Edit library data' : 'Add to library' }}</div>
                </a-btn>
              </a-list-item-title>
            </a-list-item>
            <a-list-item v-if="value.meta.isLibrary">
              <a-list-item-title>
                <a-btn @click="libraryConsumersDialogIsVisible = true" variant="text">
                  <a-icon color="grey">mdi-layers-search</a-icon>
                  <div class="ml-1">List library consumers</div>
                </a-btn>
              </a-list-item-title>
            </a-list-item>
            <a-list-item>
              <a-list-item-title>
                <a-btn variant="text" @click="printSettingDialogIsVisible = true">
                  <a-icon color="grey">mdi-printer-settings</a-icon>
                  <div class="ml-1">Print settings</div>
                </a-btn>
              </a-list-item-title>
            </a-list-item>
            <a-list-item v-if="!isNew">
              <a-list-item-title>
                <a-btn variant="text" @click="$emit('archive')">
                  <a-icon color="grey">mdi-archive</a-icon>
                  <div class="ml-1">Archive</div>
                </a-btn>
              </a-list-item-title>
            </a-list-item>
          </a-list>
        </a-menu>
        <edit-library-dialog
          v-if="editLibraryDialogIsVisible"
          v-model="editLibraryDialogIsVisible"
          :library-survey="value"
          @ok="addToLibrary"
          @cancel="editLibraryDialogIsVisible = false" />
        <list-library-consumers-dialog
          v-if="libraryConsumersDialogIsVisible"
          v-model="libraryConsumersDialogIsVisible"
          :library-survey="value"
          @cancel="libraryConsumersDialogIsVisible = false" />
        <print-settings-dialog v-model="printSettingDialogIsVisible" :survey="survey" />
      </div>
      <div class="d-flex justify-space-between align-center mt-n1">
        <div class="body-2 text-grey text-caption">
          Size: {{ surveySize }} MB
          <a-btn
            v-if="surveySize > 1"
            @click="$emit('show-version-dialog')"
            x-small
            color="white"
            elevation="0"
            class="mb-1">
            <a-icon x-small color="warning">mdi-alert</a-icon>try to clean up
          </a-btn>
        </div>
        <div class="text-left">
          <a-chip small variant="outlined" color="grey"> Version {{ version }}</a-chip>
        </div>
      </div>
    </a-card-title>
    <a-card-text>
      <div class="mt-4">
        <a-text-field
          :modelValue="surveyGroupName"
          label="Group"
          readonly
          disabled
          dense
          hide-details
          class="mb-2 survey-group-name-input" />
        <div class="d-flex flex-wrap justify-end align-center">
          <a-btn
            v-if="!isNew"
            :disabled="!enableUpdate || isSaving"
            :loading="isUpdating"
            @click="$emit('update')"
            color="primary"
            class="my-1 mr-1">
            <a-icon class="mr-1">mdi-update</a-icon>
            Update
            <a-tooltip bottom activator="parent">
              Override an existing <strong>published</strong> Survey.
              <br />
              Updating is only possible <em>only</em> when changing Labels of a Question.
            </a-tooltip>
          </a-btn>
          <a-btn class="my-1 mr-1" @click="publish" color="green" :disabled="!enablePublish">
            <a-icon class="mr-1">mdi-cloud-upload</a-icon>
            Publish
            <a-tooltip bottom activator="parent">Publish current version of Survey to users</a-tooltip>
          </a-btn>

          <a-btn
            @click="$emit('saveDraft')"
            color="primary"
            :disabled="!enableSaveDraft || isUpdating"
            :loading="isSaving"
            class="my-1 mr-1">
            <a-icon class="mr-1">mdi-content-save</a-icon>
            Save
            <a-tooltip bottom activator="parent">Save a new draft <strong>version</strong> of the Survey</a-tooltip>
          </a-btn>
        </div>
      </div>

      <a-alert v-if="validationErrors.length > 0" type="error" border="start" class="mt-2" elevation="2">
        Survey contains errors
        <a-tooltip bottom activator="parent">
          <div v-for="error in validationErrors" :key="error">
            {{ error }}
          </div>
        </a-tooltip>
      </a-alert>
    </a-card-text>
  </a-card>
</template>

<script>
import SurveyNameEditor from '@/components/builder/SurveyNameEditor.vue';
import GroupSelector from '@/components/shared/GroupSelector.vue';
import appResources from '@/components/builder/Resources.vue';
import { getGroupNameById } from '@/utils/groups';
import EditLibraryDialog from '@/components/survey/library/EditLibraryDialog';
import PublishUpdatedLibraryDialog from '@/components/survey/library/PublishUpdatedLibraryDialog';
import ListLibraryConsumersDialog from '@/components/survey/library/ListLibraryConsumersDialog';
import PrintSettingsDialog from './SurveyPrintSettingsDialog.vue';

import { calcSurveySizeMB } from '@/utils/surveys';
import api from '@/services/api.service';
import AppNavigationControl from '@/components/AppNavigationControl.vue';

const availableSubmissions = [
  { value: 'public', text: 'Everyone' },
  { value: 'group', text: 'Group members' },
  { value: 'groupAndDescendents', text: 'Group and subgroup members' },
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
      menuIsOpen: false,
      value: this.modelValue,
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
    'modelValue',
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
    AppNavigationControl,
    ListLibraryConsumersDialog,
    PublishUpdatedLibraryDialog,
    EditLibraryDialog,
    PrintSettingsDialog,
    SurveyNameEditor,
    GroupSelector,
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
    addToLibrary(library) {
      //TODO do not mutate value prop
      this.value = library;
      this.$emit('addToLibrary');
      this.editLibraryDialogIsVisible = false;
    },
  },
};
</script>

<style scoped lang="scss">
.pointer-events-none {
  pointer-events: none !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
