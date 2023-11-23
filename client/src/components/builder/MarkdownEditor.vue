<template>
  <a-dialog v-model="open" :width="getDialogWidth" persistent @click:outside="$refs.anchorRef.blur()">
    <template v-slot:activator="{ on, attrs }">
      <a-text-field
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

    <a-card>
      <a-card-title class="grey--text text--darken-2"> <slot name="title" />!! </a-card-title>

      <a-card-text>
        <div class="toolbar d-flex align-end mb-4">
          <v-btn-toggle v-model="viewMode" mandatory dense>
            <v-btn>Edit</v-btn>
            <v-btn>Preview</v-btn>
          </v-btn-toggle>
        </div>

        <div class="d-flex align-stretch">
          <div class="editor">
            <a-textarea
              v-if="viewMode === 0"
              ref="editorRef"
              v-model="markdown"
              class="resource"
              :readonly="showAttach"
              auto-grow
              hide-details
              @blur="updateCaretPosition"
              @dragover.prevent="showAttach = true"
              @dragleave.prevent="showAttach = false"
              @drop.prevent="onDrop"
              cssMarkdown
            />
            <div v-else ref="previewRef" class="preview" v-html="getPreview"></div>
            <div v-if="isLoading || showAttach" class="overlap d-flex flex-column justify-center align-center">
              <a-progress-circular v-if="isLoading" indeterminate color="primary" />
              <v-icon v-else color="gray darken-4">mdi-paperclip</v-icon>
            </div>
          </div>

          <div
            class="ressourceBloc d-flex flex-column"
            v-if="viewMode === 0"
            :class="{
              'd-none': viewMode !== 0,
            }"
          >
            <div class="toolbar mb-3" style="font-weight: 600; font-size: 1rem">
              <label for="fileRef">
                <a> + Upload new image </a>
              </label>
              <input id="fileRef" ref="fileRef" type="file" accept="image/*" class="d-none" @change="onFileChange" />
            </div>
            <v-list class="resource-panel">
              <a-list-subheader class="px-2 py-0" cssSticky>Click to insert </a-list-subheader>

              <a-list-item v-for="item in validResources" :key="item.id" link @click="onAddResource(item.id)">
                <v-list-item-content>
                  <a-list-item-title>{{ item.label }}</a-list-item-title>
                </v-list-item-content>
              </a-list-item>
            </v-list>
          </div>
        </div>
      </a-card-text>

      <a-card-actions>
        <a-spacer />
        <v-btn text @click="close">Cancel</v-btn>
        <v-btn color="primary" @click="save">Save</v-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script>
import { getPublicDownloadUrl, resourceLocations, resourceTypes } from '@/utils/resources';

import MarkdownIt from 'markdown-it';
import ADialog from '@/components/ui/ADialog.vue';

const md = new MarkdownIt({ linkify: true });
const TEXT_LENGTH = 60;

export default {
  components: {
    ADialog,
  },
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
      showAttach: false,
      isLoading: false,
      markdown: '',
      caretPosition: 0,
      viewMode: 0,
    };
  },
  computed: {
    getDialogWidth() {
      return 1050;
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
    updateCaretPosition() {
      const el = this.$refs.editorRef;
      this.caretPosition =
        el && el.inputSelectionStart() ? el.inputSelectionStart() : Math.max(this.markdown.length - 1, 0);
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

    /*<v-text-field
      label="Image URL"
      hide-details
      clearable
      class="mr-2"
      v-model="imageUrl"
      @click:clear="onClearImageUrl"
    />
    <v-btn dense @click="importImageFromUrl">insert</v-btn>

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
    },*/
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

>>> .editor .preview {
  width: 100%;
  height: 100%;
  min-height: 160px;
  max-height: 500px;
  border: 1px solid #ddd;
  overflow: hidden auto;
  outline: none;
}

>>> .editor .preview img {
  max-width: 100%;
}

.ressourceBloc {
  text-align: center;
  width: 250px;
  margin-left: 12px;
}

>>> .resource-panel {
  height: 100%;
  min-height: 300px;
  max-height: 465px;
  border: 1px solid #ddd;
  padding: 0px;
  overflow-y: auto;
}

>>> .resource-panel > * {
  border-bottom: 1px solid #eee;
}
</style>
