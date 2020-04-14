<template>
  <v-card>
    <v-card-title class="d-block pb-0">
      <div class="d-flex justify-space-between">
        <survey-name-editor
          style="max-width: 81%;"
          v-model="value.name"
        />
        <v-spacer />
        <v-dialog
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
                class="mt-4"
                label="Group"
                v-model="value.group"
                outlined
                returnObject
              />
              <v-textarea
                v-model="value.description"
                label="Description"
                class="mt-4"
                rows="2"
                outlined
              />
            </v-card-text>
            <v-card-actions />
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

export default {
  props: [
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
    surveyGroupName() {
      try {
        const { id } = this.value.group;
        const groups = this.$store.getters['memberships/groups'];
        const { name } = groups.find(({ _id }) => id === _id);
        return name;
      } catch (error) {
        return '(No group)';
      }
    },
  },
  components: {
    SurveyNameEditor,
    ActiveGroupSelector,
  },
  methods: {
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
