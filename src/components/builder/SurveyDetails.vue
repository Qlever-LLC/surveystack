<template>
  <v-card>
    <v-card-title class="d-block">
      <survey-name-editor v-model="value.name" />

      <div class="d-flex justify-space-between">

        <div class="body-2 grey--text">
          {{ value._id }}
        </div>
        <div class="text-left ">
        <v-chip
          dark
          small
          color="red"
          class="mt-n3"
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
          <v-btn
            class="my-1 mr-1"
            v-if="!isNew"
            @click="$emit('delete')"
            color="error"
            text
          >Delete</v-btn>
          <v-btn
            class="my-1 mr-1"
            @click="$emit('cancel')"
            text
          >Cancel</v-btn>

          <v-btn
            v-if="!isNew"
            :dark="enableUpdate"
            :disabled="!enableUpdate"
            @click="$emit('update')"
            color="primary"
            class="my-1 mr-1"
          >
            <div>Update</div>
          </v-btn>

          <v-tooltip
            bottom
            v-if="!isNew"
          >
            <template v-slot:activator="{ on }">
              <v-icon
                v-on="on"
                color="blue"
              >mdi-information-outline</v-icon>
            </template>

            <span>Update / Override an existing and <b>published</b> Survey.
              <br>
              Updating is only possible when <i>only</i> changing Labels of a Question.</span>

          </v-tooltip>

          <v-btn
            :dark="enableDismissDraft"
            :disabled="!enableDismissDraft"
            @click="$emit('dismissDraft')"
            color="error"
            text
            class="my-1 mr-1"
          >
            <div>Dismiss Draft</div>
          </v-btn>

          <v-btn
            :dark="enableSaveDraft"
            :disabled="!enableSaveDraft"
            @click="$emit('saveDraft')"
            color="primary"
            class="my-1 mr-1"
          >
            <div>Save Draft</div>
          </v-btn>

          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-icon
                v-on="on"
                color="blue"
              >mdi-information-outline</v-icon>
            </template>

            <span>Creates a new <b>Version</b> of the Survey</span>
          </v-tooltip>
        </div>
        <div
          style="width: 100%;"
          class="d-flex flex-wrap justify-end"
        >
          <v-btn
            :dark="enablePublish"
            large
            class="my-1 mr-1"
            @click="$emit('publish')"
            color="green"
            :disabled="!enablePublish"
          >
            Publish
          </v-btn>

          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-icon
                v-on="on"
                color="blue"
              >mdi-information-outline</v-icon>
            </template>

            <span>Roll out current state of Survey to users.</span>
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
