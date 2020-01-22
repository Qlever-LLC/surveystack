<template>
  <div>
    <v-form>
      <v-text-field v-model="value.name" label="Name" />
      <v-text-field v-model="value._id" label="id" disabled />

      <div class="d-flex justify-end">
        <v-btn v-if="editMode" @click.prevent="$emit('delete')" color="error" text>Delete</v-btn>
        <v-btn @click.prevent="$emit('cancel')" text>Cancel</v-btn>
        <v-btn @click.prevent="$emit('submit')" color="primary">{{submitText}}</v-btn>
      </div>
    </v-form>
  </div>
</template>

<script>
export default {
  props: ['value', 'editMode'],
  computed: {
    submitText() {
      return this.editMode ? 'Update Survey' : 'Create Survey';
    },
  },
};
</script>
