<template>
  <div>
    <div class="text-left"><small>Version {{version}}</small></div>
    <v-form>
      <v-text-field
        v-model="value.name"
        label="Name"
      />
      <v-text-field
        v-model="value._id"
        label="id"
        disabled
      />

      <div class="d-flex flex-wrap justify-end">
        <v-btn
          v-if="editMode"
          @click.prevent="$emit('delete')"
          color="error"
          text
        >Delete</v-btn>
        <v-btn
          @click.prevent="$emit('cancel')"
          text
        >Cancel</v-btn>
        <v-btn
          @click.prevent="$emit('submit')"
          color="primary"
        >
          <div>{{submitText}}</div>
        </v-btn>
      </div>
    </v-form>
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
