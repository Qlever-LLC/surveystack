<template>
  <div>
    <div class="text-left">
      <v-chip
        dark
        small
        color="red"
        class="mr-0 mr-1"
      >Version {{version}}</v-chip>
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
          v-if="!isNew"
          @click="$emit('delete')"
          color="error"
          text
        >Delete</v-btn>
        <v-btn
          @click="$emit('cancel')"
          text
        >Cancel</v-btn>

        <v-btn
          v-if="!isNew"
          :dark="enableUpdate"
          :disabled="!enableUpdate"
          @click="$emit('submit')"
          color="primary"
        >
          <div>Update</div>
        </v-btn>

        <v-tooltip bottom>
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
          v-if="enableSaveDraft"
          :dark="enableSaveDraft"
          :disabled="!enableSaveDraft"
          @click="$emit('submit')"
          color="primary"
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
          class="mt-4"
          @click="$emit('publish')"
          color="green"
          :disabled="!enablePublish"
        >
          Publish
        </v-btn>
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
  ],
  computed: {
    version() {
      if (this.dirty) {
        return `${this.value.latestVersion} *`;
      }
      return this.value.latestVersion;
    },
  },
};
</script>
