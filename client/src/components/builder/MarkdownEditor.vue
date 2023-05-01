<template>
  <v-dialog v-model="open" width="800" @click:outside="$refs.anchorRef.blur()">
    <template v-slot:activator="{ on, attrs }">
      <v-text-field
        ref="anchorRef"
        v-on="on"
        v-bind="attrs"
        :label="label"
        :placeholder="placeholder"
        :value="getText"
        :class="[$vnode.data.staticClass, $attrs.class]"
        :disabled="disabled"
        hide-details
        readonly
        outlined
        clearable
        @input="onChange"
      />
    </template>

    <v-card>
      <v-card-title class="grey--text text--darken-2">
        <slot name="title"></slot>
      </v-card-title>

      <v-card-text>
        <div class="d-flex justify-space-between align-end">
          <v-btn-toggle v-model="viewMode" mandatory dense>
            <v-btn>Edit</v-btn>
            <v-btn>Preview</v-btn>
          </v-btn-toggle>

          <v-btn color="primary" dense>Add Resource</v-btn>
        </div>

        <div class="wrapper">
          <v-textarea v-if="viewMode === 0" v-model="markdown" auto-grow hide-details></v-textarea>
          <div v-else class="preview mt-4" v-html="getPreview"></div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="close">Cancel</v-btn>
        <v-btn color="primary" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();
const TEXT_LENGTH = 60;

export default {
  props: {
    value: { type: String },
    label: { type: String },
    placeholder: { type: String },
    disabled: { type: Boolean },
  },
  data() {
    return {
      open: false,
      viewMode: 0,
      markdown: '',
    };
  },
  computed: {
    getText() {
      const text = this.value || '';
      return text.length > TEXT_LENGTH ? text.slice(0, TEXT_LENGTH) + '...' : text;
    },
    getPreview() {
      return md.render(this.markdown);
    },
  },
  methods: {
    onChange(val) {
      if (!val) {
        this.$emit('input', null);
      }
    },
    close() {
      this.open = false;
      this.$refs.anchorRef.blur();
    },
    save() {
      this.$emit('input', this.markdown);
      this.close();
    },
  },
  watch: {
    open(val) {
      if (val) {
        this.markdown = this.value || '';
      }
    },
  },
  created() {
    this.markdown = this.value || '';
  },
};
</script>

<style scoped>
>>> .v-text-field > .v-input__control > .v-input__slot:before,
>>> .v-text-field > .v-input__control > .v-input__slot:after {
  border: none !important;
  transition: none !important;
}

>>> .wrapper textarea,
>>> .wrapper .preview {
  width: 100%;
  min-height: 140px;
  max-height: 500px;
  border: 1px solid #ccc;
  padding: 4px 8px;
  overflow-y: auto;
}
</style>
