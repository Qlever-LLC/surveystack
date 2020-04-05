<template>
  <v-card>
    <v-card-title class="d-block pb-0">
      <div class="d-flex justify-space-between">
        <survey-name-editor
          style="max-width: 81%;"
          v-model="value.name"
        />
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
                      icon
                    >
                      <v-icon color="grey lighten-1">mdi-file-upload</v-icon>
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
                  icon
                >
                  <v-icon color="grey lighten-1">mdi-file-download</v-icon>
                  <div class="ml-1">
                    Export
                  </div>
                </v-btn>
              </v-list-item-title>
            </v-list-item>
            <v-list-item v-if="!isNew">
              <v-list-item-title>
                <v-btn
                  icon
                  @click="$emit('delete')"
                >
                  <v-icon color="grey lighten-1">mdi-delete</v-icon>
                  <div class="grey--text ml-1">
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

        <!-- <v-text-field
          outlined
          dense
          v-model="value._id"
          label="id"
          disabled
        /> -->

        <div class="d-flex flex-wrap justify-end">
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
                  :disabled="!enableSaveDraft"
                  @click="$emit('saveDraft')"
                  color="primary"
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
    </v-card-text>
  </v-card>
</template>

<script>
import SurveyNameEditor from '@/components/builder/SurveyNameEditor.vue';

export default {
  props: [
    'value',
    'isNew',
    'dirty',
    'enableUpdate',
    'enableSaveDraft',
    'enablePublish',
    'enableDismissDraft',
    'version'],
  components: {
    SurveyNameEditor,
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
</style>
