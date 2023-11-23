<template>
  <a-dialog persistent v-model="show" max-width="500" max-height="1000" @input="(v) => v">
    <a-card class="pa-4">
      <a-card-title class="headline"> Why is this instance being removed? </a-card-title>
      <a-card-text>
        <a-checkbox
          v-model="note"
          label="Farmer is no longer part of the projet"
          value="Farmer is no longer part of the projet"
        ></a-checkbox>

        <a-checkbox v-model="note" label="Accidentally added" value="Accidentally added" />

        <a-checkbox v-model="note" label="To reduce costs" value="To reduce costs" />

        <div class="d-flex mb-4">
          <a-text-field v-model.trim="noteTF" label="Other" hide-details />
        </div>

        <div class="d-flex justify-space-around">
          <a-btn :disabled="loading" :loading="loading" @click="cancelNote" color="error">Don't Add Note</a-btn>
          <a-btn :disabled="btnDisabled" :loading="loading" @click="addNote" color="primary">Submit</a-btn>
        </div>
      </a-card-text>
    </a-card>
  </a-dialog>
</template>

<script>
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
  emits: ['addNote', 'cancelNote'],
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
