<template>
  <div>
    <v-snackbar v-model="alertMessageVisible" color="orange" :timeout="6000" fixed centered>
      {{ alertMessage }}
    </v-snackbar>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      :is-modified="meta && !!meta.dateModified"
      @initialize="initialize"
    />
    <app-control-hint :value="control.hint" />

    <div @drop.prevent="onDrop" @dragover.prevent="onDragOver" @dragleave="onDragLeave">
      <input
        name="fileInput"
        id="fileInput"
        ref="fileInput"
        style="display: none"
        type="file"
        :multiple="control.options.source.allowMultiple"
        @change="filesChanged"
        :accept="
          control.options.source.types && control.options.source.types.length > 0
            ? control.options.source.types.join()
            : ''
        "
        data-test-id="fileInput"
      />
      <input
        name="captureImage"
        id="captureImage"
        ref="captureImage"
        style="display: none"
        type="file"
        @change="filesChanged"
        capture="environment"
        accept="image/*"
        data-test-id="captureImage"
      />
      <div
        class="dropzone row mx-0 text-center"
        :class="isDragging ? 'dragging' : ''"
        for="fileInput"
        @click.stop="showFileChooser"
      >
        <div class="col-12 pb-0">
          <v-icon color="primary" x-large>mdi-cloud-upload-outline</v-icon>
        </div>
        <div class="col-12 font-weight-bold">
          {{ $vuetify.breakpoint.mobile || forceMobile ? 'Tap here to upload' : 'Click or drop here to upload' }}
        </div>
        <div
          class="col-12 pt-0"
          v-if="
            ($vuetify.breakpoint.mobile || forceMobile) &&
            supportsImageCapture() &&
            isMimeTypeAllowed(control.options.source.types, 'image')
          "
        >
          <div class="col-12 pa-0 caption">--- or ----</div>
          <div class="col-12">
            <v-btn
              for="captureImage"
              class="text-center align-center justify-center"
              color="default"
              @click.stop="captureImage"
            >
              take a picture
              <v-icon right> mdi-camera-outline</v-icon>
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <v-expand-transition>
      <v-list v-if="fileResourceKeys && fileResourceKeys.length > 0" class="pb-0">
        <a-list-item
          v-for="(fileResourceKey, index) in fileResourceKeys"
          :key="fileResourceKey"
          class="file-list-item my-2"
        >
          <v-list-item-avatar>
            <v-icon v-if="isResourceTypeOf(fileResourceKey, 'image')" large>mdi-image</v-icon>
            <v-icon v-else-if="isResourceTypeOf(fileResourceKey, 'text')" large>mdi-file-document-outline</v-icon>
            <v-icon v-else-if="isResourceTypeOf(fileResourceKey, 'pdf')" large>mdi-file-document-outline</v-icon>
            <v-icon v-else large>mdi-file-outline</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <a-list-item-title
              v-if="editIndex !== index"
              :data-test-id="'file_' + index"
              class="text-wrap font-bold"
              v-text="getLabelFromKey(fileResourceKey)"
            ></a-list-item-title>
            <a-list-item-title v-if="editIndex === index" class="text-wrap font-bold">
              <v-text-field v-model="editFileName" autofocus @focusout="commitResourceName(fileResourceKey, index)" />
            </a-list-item-title>
            <a-list-item-subtitle v-if="showUploadProgressIndex === index"
              ><v-progress-linear indeterminate class="mb-0"
            /></a-list-item-subtitle>
          </v-list-item-content>
          <a-list-item-action v-if="isNameEditable(fileResourceKey) && editIndex !== index">
            <v-btn icon @click="editResourceName(fileResourceKey, index)">
              <v-icon color="grey lighten-1">mdi-pencil</v-icon>
            </v-btn>
          </a-list-item-action>
          <a-list-item-action v-if="editIndex === index">
            <v-btn icon @click="commitResourceName(fileResourceKey, index)">
              <v-icon color="success">mdi-check</v-icon>
            </v-btn>
          </a-list-item-action>
          <a-list-item-action>
            <v-btn icon @click="remove(index)">
              <v-icon color="grey lighten-1">mdi-close-circle</v-icon>
            </v-btn>
          </a-list-item-action>
        </a-list-item>
      </v-list>
    </v-expand-transition>
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
import appControlHint from '@/components/survey/drafts/ControlHint.vue';
import store from '@/store';
import { getLabelFromKey } from '@/utils/resources';
import AListItemAction from '@/components/ui/AListItemAction.vue';
import AListItemTitle from '@/components/ui/AListItemTitle.vue';
import AListItemSubtitle from '@/components/ui/AListItemSubtitle.vue';
import AListItem from '@/components/ui/AListItem.vue';

const MAX_FILE_SIZE = 20971520; //20 MB
const MAX_FILE_SIZE_IMAGES = 20971520; //20 MB TODO compress down to 512000; //500 KB

export default {
  mixins: [baseQuestionComponent],
  components: {
    AListItem,
    AListItemSubtitle,
    AListItemTitle,
    AListItemAction,
    appControlLabel,
    appControlMoreInfo,
    appControlHint,
  },
  data() {
    return {
      fileResourceKeys: this.value || [],
      isDragging: false,
      alertMessageVisible: false,
      alertMessage: null,
      showUploadProgressIndex: undefined,
      editIndex: undefined,
      editFileName: undefined,
    };
  },
  methods: {
    getLabelFromKey,
    showFileChooser() {
      this.$refs.fileInput.click();
    },
    captureImage() {
      this.$refs.captureImage.click();
    },
    async filesChanged(e) {
      const selectedFiles = e.target.files;
      for await (const file of selectedFiles) {
        try {
          await this.addFile(
            file,
            this.fileResourceKeys,
            this.control.options.source.allowMultiple,
            this.control.options.source.types
          );
        } catch (error) {
          this.showAlertMessage(error);
        }
      }
      this.changed(this.fileResourceKeys.length ? this.fileResourceKeys : null);
    },
    async onDrop(event) {
      let selectedFiles = [];
      if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        event.dataTransfer.items.forEach((item) => {
          if (item.kind === 'file') {
            selectedFiles.push(item.getAsFile());
          } else {
            this.showTypeNotAllowedAlert = true;
          }
        });
      } else {
        // Use DataTransfer interface to access the file(s)
        selectedFiles.push(...event.dataTransfer.files);
      }

      for await (const file of selectedFiles) {
        try {
          await this.addFile(
            file,
            this.fileResourceKeys,
            this.control.options.source.allowMultiple,
            this.control.options.source.types
          );
        } catch (error) {
          this.showAlertMessage(error);
        }
      }
      this.changed(this.fileResourceKeys.length ? this.fileResourceKeys : null);
      this.isDragging = false;
    },
    onDragOver(event) {
      event.dataTransfer.dropEffect = 'copy';
      this.isDragging = true;
    },
    onDragLeave() {
      this.isDragging = false;
    },
    async addFile(file, destArray, allowMultiple, allowedTypes) {
      if (!this.isMimeTypeAllowed(allowedTypes, file.type)) {
        throw Error(`This file type is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      }
      if (!this.isImageFile(file.type) && file.size > MAX_FILE_SIZE) {
        throw Error(
          'File size limit exceeded. Limit ' +
            MAX_FILE_SIZE / 1024 / 1024 +
            ' MB / Your file: ' +
            Math.round(file.size / 1024 / 1024) +
            ' MB'
        );
      }
      if (this.isImageFile(file.type) && file.size > MAX_FILE_SIZE_IMAGES) {
        throw Error(
          'Image exceeds size limit of: ' +
            MAX_FILE_SIZE_IMAGES / 1024 +
            ' KB / Your file: ' +
            Math.round(file.size / 1024) +
            ' KB'
        );
      }
      let resource = await this.$store.dispatch('resources/addLocalResource', file);

      if (allowMultiple) {
        //remove duplicates
        const index = destArray.findIndex((x) => x.endsWith(resource.label));
        if (index >= 0) {
          await this.$store.dispatch('resources/removeLocalResource', destArray[index]);
          destArray.splice(index, 1);
        }
      }
      if (!allowMultiple && destArray.length > 0) {
        //remove current resource
        await this.$store.dispatch('resources/removeLocalResource', destArray[0]);
        destArray.pop();
      }

      const newLength = destArray.push(resource.key);
      this.showUploadProgressIndex = newLength - 1;
      setTimeout(() => {
        this.showUploadProgressIndex = undefined;
      }, 1100);
    },
    isMimeTypeAllowed(allowedTypes, type) {
      if (!allowedTypes || allowedTypes.length === 0) {
        //no type restrictions
        return true;
      } else {
        return allowedTypes.some((allowedType) => type.match(allowedType));
      }
    },
    isImageFile(type) {
      return type.match('image');
    },
    isResourceTypeOf(resourceKey, type) {
      const resource = store.getters['resources/getResourceByKey'](resourceKey);
      if (resource && resource.fileData && resource.fileData.type.match(type)) {
        return true;
      } else {
        return false;
      }
    },
    isNameEditable(resourceKey) {
      const resource = store.getters['resources/getResourceByKey'](resourceKey);
      if (resource && resource.state === 'local') {
        return true;
      } else {
        return false;
      }
    },
    editResourceName(fileResourceKey, index) {
      this.editIndex = index;
      this.editFileName = getLabelFromKey(fileResourceKey);
    },
    async commitResourceName(fileResourceKey, index) {
      try {
        const resource = await this.$store.dispatch('resources/updateResourceLabel', {
          resourceKey: fileResourceKey,
          labelNew: this.editFileName,
        });
        this.fileResourceKeys[index] = resource.key;
        this.editIndex = undefined;
        this.editFileName = undefined;
        this.changed(this.fileResourceKeys);
      } catch (error) {
        this.editIndex = undefined;
        this.editFileName = undefined;
      }
    },
    showAlertMessage(error) {
      this.alertMessage = error.message;
      this.alertMessageVisible = true;
    },
    supportsImageCapture() {
      let el = document.createElement('input');
      return el.capture !== undefined;
    },
    async remove(index) {
      await this.$store.dispatch('resources/removeLocalResource', this.fileResourceKeys[index]);
      this.fileResourceKeys.splice(index, 1);
      this.changed(this.fileResourceKeys);
    },
  },
};
</script>
<style scoped>
.dropzone {
  border-radius: 4px;
  border-collapse: collapse;
  border-color: rgba(0, 0, 0, 0.38);
  border-style: dashed;
  border-width: 2px;
  min-height: 56px;
  cursor: pointer;
}

.dropzone:hover {
  border-color: var(--v-primary-base);
  background-color: #e3f2fd;
}

.dragging {
  border-color: var(--v-primary-base);
  background-color: #e3f2fd;
}

.file-list-item {
  border-radius: 4px;
  border-collapse: collapse;
  border-color: rgba(221, 221, 221);
  border-style: solid;
  border-width: 1px;
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
