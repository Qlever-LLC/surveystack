<template>
  <v-dialog v-model="show" max-width="500" max-height="1000" @input="(v) => v">
    <v-card class="pa-4">
      <v-card-title class="headline"> Why is this instance being removed? </v-card-title>
      <v-card-text>
        <v-checkbox
          v-model="note"
          label="Farmer is no longer part of the project"
          value="Farmer is no longer part of the project"
        ></v-checkbox>

        <v-checkbox v-model="note" label="Accidentally added" value="Accidentally added"></v-checkbox>

        <v-checkbox v-model="note" label="To reduce costs" value="To reduce costs"></v-checkbox>

        <div class="d-flex mb-4">
          <v-text-field v-model.trim="noteTF" label="Other" hide-details></v-text-field>
        </div>

        <v-btn block @click="addNote" color="primary">Submit</v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  emits: ['addNote'],
  props: ['value'],
  data() {
    return {
      note: [],
      noteTF: undefined,
    };
  },
  computed: {
    show: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit('input', value);
      },
    },
  },
  methods: {
    addNote() {
      if (this.noteTF) {
        this.note.push(this.noteTF);
      }
      const noteConcat = this.note.join(', ');
      this.$emit('addNote', noteConcat);
      this.noteTF = undefined;
      this.note = [];
    },
  },
};
</script>
