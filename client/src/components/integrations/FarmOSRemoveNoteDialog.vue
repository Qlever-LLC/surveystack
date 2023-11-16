<template>
  <a-dialog persistent v-model="show" max-width="500" max-height="1000" @input="(v) => v">
    <v-card class="pa-4">
      <v-card-title class="headline"> Why is this instance being removed? </v-card-title>
      <v-card-text>
        <v-checkbox
          v-model="note"
          label="Farmer is no longer part of the projet"
          value="Farmer is no longer part of the projet"
        ></v-checkbox>

        <v-checkbox v-model="note" label="Accidentally added" value="Accidentally added"></v-checkbox>

        <v-checkbox v-model="note" label="To reduce costs" value="To reduce costs"></v-checkbox>

        <div class="d-flex mb-4">
          <v-text-field v-model.trim="noteTF" label="Other" hide-details></v-text-field>
        </div>

        <div class="d-flex justify-space-around">
          <v-btn :disabled="loading" :loading="loading" @click="cancelNote" color="error">Don't Add Note</v-btn>
          <v-btn :disabled="btnDisabled" :loading="loading" @click="addNote" color="primary">Submit</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </a-dialog>
</template>

<script>
import ADialog from '@/components/ui/ADialog.vue';

export default {
  emits: ['addNote', 'cancelNote'],
  components: {
    ADialog,
  },
  props: ['loading', 'value'],
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
    btnDisabled() {
      return !(this.note.length > 0 || this.noteTF) || this.loading;
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
    cancelNote() {
      this.noteTF = undefined;
      this.note = [];
      this.$emit('cancelNote');
    },
  },
};
</script>
