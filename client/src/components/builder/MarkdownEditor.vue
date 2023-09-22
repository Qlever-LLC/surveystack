<template>
  <v-dialog v-model="open" :width="getDialogWidth" persistent @click:outside="$refs.anchorRef.blur()">
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
        @input="onTextFieldChange"
      />
    </template>

    <v-card>
      <v-card-title class="grey--text text--darken-2">
        <slot name="title"></slot>
      </v-card-title>

      <v-card-text>
        <div class="toolbar d-flex align-end mb-4">
          <v-btn-toggle v-model="viewMode" mandatory dense>
            <v-btn>Edit</v-btn>
            <v-btn>Preview</v-btn>
          </v-btn-toggle>

          <template v-if="viewMode === 0">
            <v-btn class="ml-auto" color="primary" dense :disabled="resourceOpen" @click="openResource">
              <v-icon class="mr-1">mdi-plus</v-icon>
              Add Image
            </v-btn>
          </template>
        </div>

        <div class="d-flex align-stretch">
          <div class="editor">
            <v-textarea
              v-if="viewMode === 0"
              ref="editorRef"
              v-model="markdown"
              :class="{ resource: resourceOpen }"
              :readonly="showAttach"
              auto-grow
              hide-details
              @blur="updateCaretPosition"
              @dragover.prevent="showAttach = true"
              @dragleave.prevent="showAttach = false"
              @drop.prevent="onDrop"
            ></v-textarea>
            <div v-else ref="previewRef" class="preview" v-html="getPreview"></div>
            <div v-if="isLoading || showAttach" class="overlap d-flex flex-column justify-center align-center">
              <v-progress-circular v-if="isLoading" indeterminate color="primary"></v-progress-circular>
              <v-icon v-else color="gray darken-4">mdi-paperclip</v-icon>
            </div>
          </div>

          <div
            class="ressourceBloc"
            v-if="resourceOpen"
            :class="{
              'd-none': viewMode !== 0,
            }"
          >
            <div class="toolbar">
              <label for="fileRef">
                <v-btn dense class="mb-1">
                  <v-icon class="mr-1">mdi-upload</v-icon>
                  Import Local Image
                </v-btn>
              </label>
              <input id="fileRef" ref="fileRef" type="file" accept="image/*" class="d-none" @change="onFileChange" />
            </div>
            <v-list class="resource-panel" dense>
              <v-subheader>
                Survey Resources
                <v-btn class="ml-auto" icon @click="resourceOpen = false"><v-icon>mdi-close</v-icon></v-btn>
              </v-subheader>

              <v-list-item v-for="item in validResources" :key="item.id" link @click="onAddResource(item.id)">
                <v-list-item-content>
                  <v-list-item-title>{{ item.label }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
            <div class="d-flex align-end">
              <v-text-field
                label="Image URL"
                hide-details
                clearable
                class="mr-2"
                v-model="imageUrl"
                @click:clear="onClearImageUrl"
              />
              <v-btn dense @click="importImageFromUrl">import</v-btn>
            </div>
            <div
              :class="{
                'd-none': UrlErrorState === 0,
              }"
              style="color: red"
            >
              Unable to import this image
            </div>
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
      resourceOpen: false,
      showAttach: false,
      isLoading: false,
      markdown: '',
      caretPosition: 0,
      viewMode: 0,
      imageUrl: '',
      UrlErrorState: 0,
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
    validResources() {
      // Filter File/Image resources
      return this.resources.filter(
        (resource) => resource.type === resourceTypes.FILE || resource.type === resourceTypes.IMAGE
      );
    },
  },
  methods: {
    update(resource) {
      if (!resource) {
        return;
      }

      // Get markdown slices
      const before = this.markdown.slice(0, this.caretPosition);
      const after = this.markdown.slice(this.caretPosition);

      // Get resource URL
      const url = resource.type === resourceTypes.FILE ? getPublicDownloadUrl(resource.key, true) : resource.content;

      // Make image/file link in markdown
      let resourceMd = `[${resource.label}](${url})`;
      if (
        resource.type === resourceTypes.IMAGE ||
        (resource.contentType && resource.contentType.startsWith('image/'))
      ) {
        resourceMd = '!' + resourceMd;
      }

      this.markdown = `${before}\n${resourceMd}\n${after}`;
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
      // Add to survey resource
      this.$emit('set-survey-resources', [...this.resources, newResource]);

      // Update markdown
      this.update({ ...resource, type: resourceTypes.FILE });

      this.isLoading = false;
    },
    openResource() {
      this.resourceOpen = true;
      this.$nextTick(() => {
        this.$refs.editorRef.focus();
      });
    },
    updateCaretPosition() {
      const el = this.$refs.editorRef;
      this.caretPosition =
        el && el.$refs.input.selectionStart ? el.$refs.input.selectionStart : Math.max(this.markdown.length - 1, 0);
    },
    onAddResource(resId) {
      // Load resource
      let resource = this.resources.find((res) => res.id === resId);
      if (!resource) {
        console.warn('Cannot load resource with ID:', resId);
        return;
      }

      if (resource.type === resourceTypes.FILE) {
        resource = {
          ...this.$store.getters['resources/getResource'](resId),
          type: resourceTypes.FILE,
        };
      }

      this.update(resource);
    },
    onTextFieldChange(val) {
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
      this.showAttach = false;
      const file = e.dataTransfer.files[0];
      if (!file) {
        return;
      }
      await this.createFileResource(file);
    },
    onClearImageUrl() {
      this.UrlErrorState = 0;
    },
    secureUrl(url) {
      const indexInterrogation = url.indexOf('?');
      if (indexInterrogation !== -1) {
        return url.slice(0, indexInterrogation);
      } else {
        return url;
      }
    },
    async importImageFromUrl() {
      const imageUrl = this.secureUrl(this.imageUrl);

      const fileExtension = imageUrl.split('.').pop().toLowerCase();

      try {
        await fetch(imageUrl).then(async (response) => {
          const blob = await response.blob();
          const file = new File([blob], imageUrl, { type: `image/${fileExtension}` });
          await this.createFileResource(file);
        });
      } catch (error) {
        this.UrlErrorState = 1;
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

      this.resourceOpen = false;
      this.isLoading = false;
      this.viewMode = 0;
      this.markdown = this.value || '';
      this.updateCaretPosition();
    },
  },
  created() {
    this.markdown = this.value || '';
  },
};
</script>

<style scoped>
>>> .toolbar label button {
  pointer-events: none !important;
}

>>> .editor {
  position: relative;
  flex: 1 1 0%;
}

>>> .editor > .overlap {
  position: absolute;
  inset: 0px;
  background-color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
}

>>> .editor .v-textarea {
  margin: 0px;
  padding: 0px;
}

>>> .editor textarea,
>>> .editor .preview {
  width: 100%;
  height: 100%;
  min-height: 160px;
  max-height: 500px;
  border: 1px solid #ddd;
  overflow: hidden auto;
  outline: none;
}

>>> .editor .v-textarea.resource textarea {
  min-height: 400px;
}

>>> .editor textarea {
  padding: 2px 8px;
}

>>> .editor textarea:read-only {
  border: 1.5px dashed #888;
  border-radius: 4px;
}

>>> .editor .preview img {
  max-width: 100%;
}

>>> .editor > .v-textarea.v-text-field > .v-input__control > .v-input__slot:before,
>>> .editor > .v-textarea.v-text-field > .v-input__control > .v-input__slot:after {
  border: none !important;
  transition: none;
}

.ressourceBloc {
  width: 300px;
  margin-left: 12px;
  text-align: center;
}

>>> .resource-panel {
  min-height: 300px;
  border: 1px solid #ddd;
  padding: 0px;
  overflow-y: auto;
}

>>> .resource-panel > * {
  border-bottom: 1px solid #eee;
}

>>> .resource-panel .v-subheader {
  position: sticky;
  top: 0;
  background: white;
  border-bottom: 2px solid #ddd;
  font-weight: 600;
  font-size: 1rem;
  z-index: 1;
}
</style>
