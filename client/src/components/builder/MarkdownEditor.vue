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
          <v-textarea
            v-if="viewMode === 0"
            ref="editorRef"
            v-model="markdown"
            auto-grow
            hide-details
            @drop.prevent="onDrop"
          ></v-textarea>
          <div v-else ref="previewRef" class="preview mt-4" v-html="getPreview"></div>
          <div v-if="isLoading" class="loading d-flex flex-column justify-center align-center">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
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
import { getPublicDownloadUrl, resourceLocations, resourceTypes } from '@/utils/resources';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ linkify: true });
const TEXT_LENGTH = 60;

export default {
  props: {
    value: { type: String },
    label: { type: String },
    placeholder: { type: String },
    disabled: { type: Boolean },
    resources: { type: Array, default: () => [] },
  },
  data() {
    return {
      open: false,
      viewMode: 0,
      markdown: '',
      isLoading: false,
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
    async createFileResource(file) {
      this.isLoading = true;

      // Create new remote file resource
      const id = await this.$store.dispatch('resources/addRemoteResource', file);
      const resource = this.$store.getters['resources/getResource'](id);
      const newResource = {
        id,
        name: resource.name,
        label: resource.label,
        type: resourceTypes.FILE,
        location: resourceLocations.REMOTE,
      };

      // Add to survey resource
      this.$emit('set-survey-resources', [...this.resources, newResource]);
      this.isLoading = false;

      return resource.key;
    },
    onChange(val) {
      if (!val) {
        this.$emit('input', null);
      }
    },
    async onDrop(e) {
      const files = e.dataTransfer.files;
      const cursorPos =
        typeof e.target.selectionStart === 'number' ? e.target.selectionStart : e.targe.value.length - 1;

      const file = files[0];
      if (!file) {
        return;
      }

      const key = await this.createFileResource(file);
      const before = this.markdown.slice(0, cursorPos);
      const after = this.markdown.slice(cursorPos);
      const imageMd = `![${file.name}](${getPublicDownloadUrl(key, true)})`;
      this.markdown = `${before} ${imageMd} ${after}`;
    },
    focus() {
      const el = this.$refs.editorRef;
      if (!el) {
        return;
      }
      if (el.setSelectionRange) {
        el.focus();
        el.setSelectionRange(0, 0);
      } else if (el.createTextRange) {
        var range = el.createTextRange();
        range.moveStart('character', 0);
        range.select();
      } else {
        el.selectionStart = 0;
        el.selectionEnd = 0;
        el.focus();
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
      if (!val) {
        return;
      }

      this.markdown = this.value || '';
      setTimeout(() => this.focus(), 200);
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

>>> .wrapper {
  position: relative;
}

>>> .wrapper > .loading {
  position: absolute;
  inset: 0px;
  top: 12px;
  background-color: rgba(220, 220, 220, 0.75);
}

>>> .wrapper textarea,
>>> .wrapper .preview {
  width: 100%;
  min-height: 140px;
  max-height: 500px;
  border: 1px solid #ccc;
  padding: 4px 8px;
  overflow: auto;
}

>>> .wrapper .preview img {
  max-width: 100%;
}
</style>
