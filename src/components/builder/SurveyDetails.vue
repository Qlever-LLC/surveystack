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
          v-if="editMode"
          @click="$emit('delete')"
          color="error"
          text
        >Delete</v-btn>
        <v-btn
          @click="$emit('cancel')"
          text
        >Cancel</v-btn>
        <v-btn
          @click="$emit('submit')"
          color="primary"
        >
          <div>{{submitText}}</div>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['value', 'editMode', 'dirty'],
  computed: {
    submitText() {
      return this.editMode ? 'Update' : 'Create';
    },
    version() {
      if (this.dirty) {
        return `${this.value.latestVersion} *`;
      }
      return this.value.latestVersion;
    },
  },
};
</script>
