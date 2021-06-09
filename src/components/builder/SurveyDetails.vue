<template>
  <v-card>
    <v-card-title class="d-block pb-0">
      <div class="d-flex">
        <survey-name-editor v-model="value.name" />
        <v-spacer />
        <v-dialog
          v-model="editDetailsDialogIsVisible"
          width="500"
          max-width="75%"
        >
          <template v-slot:activator="{ on }">
            <v-btn
              icon
              v-on="on"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-title>
              Edit Survey Details
            </v-card-title>
            <v-card-text>
              <active-group-selector
                class="my-4"
                label="Group"
                v-model="value.meta.group"
                outlined
                returnObject
              />
              <v-select
                outlined
                v-model="value.meta.submissions"
                label="Allow Submissions for..."
                :items="availableSubmissions"
              />
              <v-textarea
                v-model="value.description"
                label="Description"
                class="mt-4"
                rows="4"
                outlined
              />
            </v-card-text>
            <v-card-actions class="mr-3">
              <v-spacer />
              <v-btn
                @click="editDetailsDialogIsVisible = false"
                color="primary"
                text
              >
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-dialog
          v-model="resourcesDialogIsVisible"
          width="800"
          max-width="80%"
        >
          <template v-slot:activator="{ on }">
            <v-btn
              icon
              v-on="on"
            >
              <v-icon>mdi-dresser</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-title>
              Survey Resources
            </v-card-title>
            <v-card-text>

              <app-resources
                :resources="survey.resources"
                @set-survey-resources="(val) => $emit('set-survey-resources', val)"
              />
            </v-card-text>
            <v-card-actions class="mr-3">
              <v-spacer />
              <v-btn
                @click="resourcesDialogIsVisible = false"
                color="primary"
                text
              >
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-menu
          offset-y
          left
        >
          <template v-slot:activator="{ on }">
            <v-btn
              icon
              v-on="on"
            >
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item class="d-flex align-center">
              <v-list-item-title>
                <v-input hide-details>
                  <label
                    for="select-items-file-input-surveydetails"
                    class="cursor-pointer"
                  >
                    <v-btn
                      class="pointer-events-none"
                      text
                    >
                      <v-icon color="grey">mdi-file-upload</v-icon>
                      <div class="ml-1">
                        Import
                      </div>
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
                </v-input>
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>
                <v-btn
                  @click="$emit('export-survey')"
                  text
                >
                  <v-icon color="grey">mdi-file-download</v-icon>
                  <div class="ml-1">
                    Export
                  </div>
                </v-btn>
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>
                <v-dialog
                  v-model="editLibraryDialogIsVisible"
                  width="500"
                  max-width="75%"
                >
                  <template v-slot:activator="{ on }">
                    <v-btn
                      v-on="on"
                      text
                    >
                      <v-icon color="grey">mdi-library</v-icon>
                      <div class="ml-1" v-if="!value.meta.isLibrary">
                        add to library
                      </div>
                      <div class="ml-1" v-if="value.meta.isLibrary">
                        edit library data
                      </div>
                    </v-btn>
                  </template>
                  <v-card>
                    <v-card-title>
                      Add Survey To Library
                    </v-card-title>
                    <v-card-text>
                      <v-text-field
                        :value="value.name"
                        label="Title"
                        readonly
                        disabled>
                      </v-text-field>
                      <h3>Description</h3>
                      <tip-tap-editor
                        v-model="value.meta.libraryDescription"
                        class="mb-4"
                      />
                      <h3>Applications</h3>
                      <tip-tap-editor
                        v-model="value.meta.libraryApplications"
                        class="mb-4"
                      />
                      <h3>Maintainers</h3>
                      <tip-tap-editor
                        v-model="value.meta.libraryMaintainers"
                        class="mb-4"
                      />
                      <h3>Version history</h3>
                      <tip-tap-editor
                        v-model="value.meta.libraryHistory"
                        class="mb-4"
                      />
                    </v-card-text>
                    <v-card-actions class="mr-3">
                      <v-spacer />
                      <v-btn
                        @click="$emit('addToLibrary');editLibraryDialogIsVisible = false;"
                        color="primary"
                        text
                      >
                        <span v-if="!value.meta.isLibrary">Add to library</span>
                        <span v-if="value.meta.isLibrary">Save</span>
                      </v-btn>
                      <v-btn
                        @click="editLibraryDialogIsVisible = false"
                        color="primary"
                        text
                      >
                        Cancel
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </v-list-item-title>
            </v-list-item>
            <v-list-item v-if="!isNew">
              <v-list-item-title>
                <v-btn
                  text
                  @click="$emit('delete')"
                >
                  <v-icon color="grey">mdi-delete</v-icon>
                  <div class="ml-1">
                    Delete
                  </div>
                </v-btn>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

      </div>
      <div class="d-flex justify-space-between align-center mt-n1">

        <div class="body-2 grey--text caption">
          {{ value._id }}
        </div>
        <div class="text-left ">
          <v-chip
            dark
            small
            outlined
            color="grey"
          >
            Version {{ version }}
          </v-chip>
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
          <!-- <v-btn
            class="my-1 mr-1"
            @click="$emit('cancel')"
            text
          >Cancel</v-btn> -->
          <v-tooltip
            bottom
            v-if="!isNew"
          >
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-btn
                  v-if="!isNew"
                  :dark="enableUpdate"
                  :disabled="!enableUpdate"
                  @click="$emit('update')"
                  color="primary"
                  class="my-1 mr-1"
                >
                  <v-icon class="mr-1">mdi-update</v-icon>
                  Update
                </v-btn>
              </div>
            </template>
            <span>Override an existing <strong>published</strong> Survey.
              <br>
              Updating is only possible <em>only</em> when changing Labels of a Question.</span>
          </v-tooltip>

          <!-- <v-btn
            :dark="enableDismissDraft"
            :disabled="!enableDismissDraft"
            @click="$emit('dismissDraft')"
            color="error"
            text
            class="my-1 mr-1"
          >
            <div>Dismiss Draft</div>
          </v-btn> -->

          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-btn
                  :dark="enablePublish"
                  class="my-1 mr-1"
                  @click="$emit('publish')"
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
                  :disabled="!enableSaveDraft"
                  class="my-1 mr-1"
                >
                  <v-icon class="mr-1">mdi-content-save</v-icon>
                  Save
                </v-btn>
              </div>
            </template>
            <span>Save a new draft <strong>version</strong> of the Survey</span>
          </v-tooltip>
          <!-- <v-tooltip bottom v-if="validationErrors.length > 0">
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-icon small color="error">mdi-close-circle-outline</v-icon>
              </div>
            </template>
            <span
              v-for="error in validationErrors"
              :key="error"
            >
              {{error}}
            </span>
          </v-tooltip> -->
        </div>
      </div>

      <v-tooltip
        bottom
        v-if="validationErrors.length > 0"
      >
        <template v-slot:activator="{ on }">
          <!-- <div v-on="on" class="text-center mt-4 error--text" >
            <v-icon color="error">mdi-exclamation</v-icon>
            Survey contains errors
          </div> -->
          <v-alert
            type="error"
            colored-border
            border="left"
            class="mt-2"
            elevation="2"
            v-on="on"
          >
            Survey contains errors
          </v-alert>
        </template>
        <div
          v-for="error in validationErrors"
          :key="error"
        >
          {{error}}
        </div>
      </v-tooltip>
    </v-card-text>
  </v-card>
</template>

<script>
import SurveyNameEditor from '@/components/builder/SurveyNameEditor.vue';
import ActiveGroupSelector from '@/components/shared/ActiveGroupSelector.vue';
import appResources from '@/components/builder/Resources.vue';
import TipTapEditor from '@/components/builder/TipTapEditor.vue';
import api from '@/services/api.service';

const availableSubmissions = [{ value: 'public', text: 'Everyone' }, { value: 'user', text: 'Logged in users' }, { value: 'group', text: 'Group members' }];

export default {
  data() {
    return {
      resourcesDialogIsVisible: false,
      editDetailsDialogIsVisible: false,
      editLibraryDialogIsVisible: false,
      surveyGroupName: 'Group Not Found',
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
    'dirty',
    'enableUpdate',
    'enableSaveDraft',
    'enablePublish',
    'enableDismissDraft',
    'version',
    'validationErrors',
  ],
  computed: {
    // surveyGroupName() {
    //   const { id } = this.value.group;
    //   const groups = this.$store.getters['memberships/groups'];
    //   const { name } = groups.find(({ _id }) => id === _id);
    //   if (!name) {

    //   }
    //   return name;
    // },
  },
  watch: {
    value: {
      async handler(value, oldValue) {
        // console.log(value.group.id, this.value.group.id);
        // if (
        //   value.group && oldValue.group && value.group.id && oldValue.group.id
        //   && value.group.id === oldValue.group.id
        // ) {
        //   console.log('groups are same');
        //   return;
        // }
        if (value.meta.group && value.meta.group.id) {
          this.surveyGroupName = await this.getGroupNameById(value.meta.group.id);
        }
      },
      deep: true,
    },
  },
  components: {
    SurveyNameEditor,
    ActiveGroupSelector,
    appResources,
    TipTapEditor,
  },
  methods: {
    async getGroupNameById(id) {
      const groups = this.$store.getters['memberships/groups'];
      // const { name } = groups.find(({ _id }) => id === _id);
      const result = groups.find(({ _id }) => id === _id);
      if (result) {
        return result.name;
      }
      const response = await api.get(`/groups/${id}`);
      return response.data.name;
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
