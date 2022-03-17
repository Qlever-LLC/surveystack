<template>
  <div>
    <v-snackbar v-model="alertMessageVisible" color="orange" :timeout="6000" fixed centered>
      {{ alertMessage }}
    </v-snackbar>
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <app-control-hint :value="control.hint" />

    <div @drop.prevent="onDrop" @dragover.prevent="onDragOver">
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
        :multiple="control.options.source.allowMultiple"
        @change="filesChanged"
        capture="environment"
        data-test-id="captureFile"
      />
      <div class="dropzone row mx-0 text-center" for="fileInput" @click.stop="showFileChooser">
        <div class="col-12 pt-4">
          {{ $vuetify.breakpoint.mobile || forceMobile ? 'tap here to upload' : 'click or drop here to upload' }}
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
        <div v-if="fileResourceKeys && fileResourceKeys.length > 0" class="ma-3">
          <v-chip
            v-for="(fileResourceKey, index) in fileResourceKeys"
            :key="fileResourceKey"
            label
            text-color="white"
            color="grey"
            class="ma-1 expanding-chip"
            close
            @click:close="remove(index)"
            :data-test-id="'file_' + index"
            ><span class="text-wrap"> {{ fileResourceKey.substring(fileResourceKey.lastIndexOf('/') + 1) }}</span>
          </v-chip>
        </div>
      </div>
    </div>

    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
import appControlHint from '@/components/survey/drafts/ControlHint.vue';

const MAX_FILE_SIZE = 20971520; //20 MB
const MAX_FILE_SIZE_IMAGES = 512000; //500 KB

export default {
  mixins: [baseQuestionComponent],
  components: {
    appControlLabel,
    appControlMoreInfo,
    appControlHint,
  },
  props: {},
  data() {
    return {
      fileResourceKeys: this.value || [],
      alertMessageVisible: false,
      alertMessage: null,
    };
  },
  computed: {},
  watch: {},
  methods: {
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
    },
    onDragOver(event) {
      event.dataTransfer.dropEffect = 'copy';
    },
    async addFile(file, destArray, allowMultiple, allowedTypes) {
      if (!this.isMimeTypeAllowed(allowedTypes, file.type)) {
        throw 'Drop not allowed for this file type. Allowed types: ' + allowedTypes.join(', ');
      }
      if (!this.isImage(file.type) && file.size > MAX_FILE_SIZE) {
        throw (
          'File size limit exceeded. Limit ' +
          MAX_FILE_SIZE / 1024 / 1024 +
          ' MB / Your file: ' +
          Math.round(file.size / 1024 / 1024) +
          ' MB'
        );
      }
      if (this.isImage(file.type) && file.size > MAX_FILE_SIZE_IMAGES) {
        throw (
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
        const index = destArray.findIndex((x) => x === resource.key);
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

      destArray.push(resource.key);
    },
    isMimeTypeAllowed(allowedTypes, type) {
      if (!allowedTypes || allowedTypes.length === 0) {
        //no type restrictions
        return true;
      } else {
        return !!allowedTypes.find((allowedType) => type.match(allowedType));
      }
    },
    isImage(type) {
      return type.match('image');
    },
    showAlertMessage(error) {
      this.alertMessage = error;
      this.alertMessageVisible = true;
    },
    supportsImageCapture() {
      let i = document.createElement('input');
      i.setAttribute('capture', true);
      return !!i['capture'];
    },
    async remove(index) {
      await this.$store.dispatch('resources/removeLocalResource', this.fileResourceKeys[index]);
      this.fileResourceKeys.splice(index, 1);
      this.changed(this.fileResourceKeys);
    },
    submit() {
      this.changed(this.fileResourceKeys);
      this.$emit('next');
    },
  },
};
</script>
<style scoped>
.dropzone {
  border-radius: 4px;
  border-collapse: collapse;
  border-color: rgba(0, 0, 0, 0.38);
  border-style: solid;
  border-width: 1px;
  min-height: 56px;
  cursor: pointer;
}
.dropzone:hover {
  border-color: black;
}
.expanding-chip {
  min-height: 32px;
  height: auto;
}
</style>
