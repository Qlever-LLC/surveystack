<template>
  <v-dialog v-model="open" :width="getDialogWidth" @click:outside="$refs.anchorRef.blur()">
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
        <div class="d-flex align-end mb-4">
          <v-btn-toggle v-model="viewMode" mandatory dense>
            <v-btn>Edit</v-btn>
            <v-btn>Preview</v-btn>
          </v-btn-toggle>

          <label for="fileRef" class="ml-auto mr-2 cursor-pointer">
            <v-btn class="pointer-events-none" dense>
              <v-icon class="mr-1">mdi-upload</v-icon>
              Add Image
            </v-btn>
          </label>
          <v-btn color="primary" dense @click="resourceOpen = true">
            <v-icon class="mr-1">mdi-plus</v-icon>
            Add Resource
          </v-btn>
          <input type="file" id="fileRef" ref="fileRef" class="d-none" @change="onFileChange" />
        </div>

        <div class="wrapper d-flex align-stretch">
          <div class="editor">
            <textarea v-if="viewMode === 0" ref="editorRef" v-model="markdown" @drop.prevent="onDrop"></textarea>
            <div v-else ref="previewRef" class="preview" v-html="getPreview"></div>
            <div v-if="isLoading" class="loading d-flex flex-column justify-center align-center">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
          </div>

          <v-list
            v-if="resourceOpen"
            class="resource-panel"
            :class="{
              'd-none': viewMode !== 0,
            }"
            dense
          >
            <v-subheader>
              Survey Resources
              <v-btn class="ml-auto" icon @click="resourceOpen = false"><v-icon>mdi-close</v-icon></v-btn>
            </v-subheader>
            <v-list-item v-for="item in resources" :key="item.id" link @click="update(item.label, item.id)">
              <v-list-item-content>
                <v-list-item-title>{{ item.label }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
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
      resourceOpen: false,
      viewMode: 0,
      markdown: '',
      isLoading: false,
    };
  },
  computed: {
    getDialogWidth() {
      return this.resourceOpen ? 1050 : 750;
    },
    getText() {
      const text = this.value || '';
      return text.length > TEXT_LENGTH ? text.slice(0, TEXT_LENGTH) + '...' : text;
    },
    getPreview() {
      return md.render(this.markdown);
    },
  },
  methods: {
    update(alt, resId) {
      if (!resId) {
        return;
      }

      // Get image url
      const resource = this.$store.getters['resources/getResource'](resId);
      const url = getPublicDownloadUrl(resource.key, true);

      if (!url) {
        console.warn('Cannot load resource url with ID:', resId);
        return;
      }

      // Update markdown text
      const pos = this.$refs.editorRef.selectionStart;
      const before = this.markdown.slice(0, pos);
      const after = this.markdown.slice(pos);
      const imageMd = `![${alt || 'Image'}](${url})`;
      this.markdown = `${before} ${imageMd} ${after}`;
    },
    async createFileResource(file) {
      this.isLoading = true;
      // Create new remote file resource
      const resId = await this.$store.dispatch('resources/addRemoteResource', file);
      const resource = this.$store.getters['resources/getResource'](resId);
      const newResource = {
        id: resId,
        name: resource.name,
        label: resource.label,
        type: resourceTypes.FILE,
        location: resourceLocations.REMOTE,
      };
      this.update(file.name, resId);
      // Add to survey resource
      this.$emit('set-survey-resources', [...this.resources, newResource]);
      this.isLoading = false;
    },
    onChange(val) {
      if (!val) {
        this.$emit('input', null);
      }
    },
    async onFileChange(e) {
      const file = e.target.files[0];
      if (!file) {
        return;
      }
      await this.createFileResource(file);
      this.$refs.fileRef.value = null;
    },
    async onDrop(e) {
      const file = e.dataTransfer.files[0];
      if (!file) {
        return;
      }
      await this.createFileResource(file);
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
>>> .wrapper {
  max-height: 500px;
}

>>> .editor {
  position: relative;
  flex: 1 1 0%;
}

>>> .editor > .loading {
  position: absolute;
  inset: 0px;
  top: 12px;
  background-color: rgba(220, 220, 220, 0.75);
}

>>> .editor textarea,
>>> .editor .preview {
  width: 100%;
  height: 100%;
  min-height: 160px;
  border: 1px solid #ddd;
  overflow: auto;
  outline: none;
}
>>> .editor textarea {
  padding: 4px 8px;
}

>>> .editor .preview img {
  max-width: 100%;
}

>>> .resource-panel .v-subheader {
  font-weight: 600;
  font-size: 1rem;
  border-bottom: 2px solid #ddd;
  padding-bottom: 8px;
}

>>> .resource-panel {
  width: 300px;
  margin-left: 12px;
  min-height: 300px;
  border: 1px solid #ddd;
}

>>> .resource-panel > * {
  border-bottom: 1px solid #eee;
}
</style>
