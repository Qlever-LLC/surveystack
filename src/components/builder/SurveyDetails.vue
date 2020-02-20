<template>
  <div>
    <div class="text-left">
      <v-chip
        dark
        small
        color="red"
        class="mr-0 mr-1"
      >Version {{ version }}</v-chip>
    </div>
    <div class="mt-4">
      <v-text-field
        outlined
        v-model="value.name"
        label="Name"
      />
      <v-text-field
        outlined
        v-model="value._id"
        label="id"
        disabled
      />

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
          @click="$emit('submit')"
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
  </div>
</template>

<script>
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
};
</script>
