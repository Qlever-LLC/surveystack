<template>
  <div>
    <v-snackbar v-model="showTypeNotAllowedAlert" color="orange" :timeout="5000" fixed centered>
      Drop not allowed for this file type. Allowed types: {{ control.options.source.types.join(', ') }}
    </v-snackbar>
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <app-control-hint :value="control.hint" />
    <div @drop.prevent="onDrop" @dragover.prevent="onDragOver">
      <v-file-input
        id="fileChooser"
        name="fileChooser"
        :placeholder="$vuetify.breakpoint.mobile || forceMobile ? 'tap here to upload' : 'click or drop here to upload'"
        outlined
        show-size
        hide-details="auto"
        :clearable="control.options.source.allowMultiple"
        :multiple="control.options.source.allowMultiple"
        v-model="files"
        :accept="
          control.options.source.types && control.options.source.types.length > 0
            ? control.options.source.types.join()
            : ''
        "
        :chips="control.options.source.allowMultiple"
        :label="control.hint"
        @keyup.enter.prevent="submit"
        @click:clear="clear"
        @change="filesChanged"
        color="focus"
        data-test-id="input"
      >
        <template v-slot:selection="{ text, index }">
          <v-chip
            label
            text-color="white"
            color="grey"
            close
            @click:close="remove(index)"
            :data-test-id="'file_' + index"
          >
            {{ text }}
          </v-chip>
        </template>
      </v-file-input>
    </div>
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
import appControlHint from '@/components/survey/drafts/ControlHint.vue';

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
      files: this.value || [],
      previousFiles: this.value || [],
      showTypeNotAllowedAlert: false,
    };
  },
  computed: {},
  watch: {},
  methods: {
    async filesChanged(e) {
      if (this.control.options.source.allowMultiple) {
        // file chooser REPLACES already chosen files by the newly chosen files.
        // To prevent this, use additional array previousFiles as a backup and restore previously selected files
        const newFiles = this.$el.querySelector('#fileChooser').files;
        newFiles.forEach((file) => {
          this.addFile(file, this.previousFiles);
        });
        this.files = this.previousFiles;
      }

      this.changed(this.files.length ? this.files : null);
    },
    addFile(file, destArray) {
      if (destArray.length === 0) {
        destArray.push(file);
      } else {
        //prevent duplicates
        const index = destArray.findIndex((x) => x.name === file.name);
        if (index >= 0) {
          destArray.splice(index, 1);
        }
        destArray.push(file);
      }
    },
    onDrop(event) {
      this.showTypeNotAllowedAlert = false;
      let newFiles = [];
      if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        event.dataTransfer.items.forEach((item) => {
          if (item.kind === 'file' && this.isMimeTypeAllowed(this.control.options.source.types, item.type)) {
            newFiles.push(item.getAsFile());
          } else {
            this.showTypeNotAllowedAlert = true;
          }
        });
      } else {
        // Use DataTransfer interface to access the file(s)
        newFiles.push(...event.dataTransfer.files);
      }

      if (newFiles && newFiles.length > 0) {
        if (this.control.options.source.allowMultiple) {
          newFiles.forEach((file) => {
            this.addFile(file, this.files);
          });
        } else {
          this.files = [newFiles[0]];
        }

        this.changed(this.files.length ? this.files : null);
      }
    },
    onDragOver(event) {
      event.dataTransfer.dropEffect = 'copy';
    },
    isMimeTypeAllowed(allowedTypes, type) {
      if (!allowedTypes || allowedTypes.length === 0) {
        //no type restrictions
        return true;
      } else {
        return !!allowedTypes.find((allowedType) => type.match(allowedType));
      }
    },
    clear() {
      this.previousFiles = [];
      this.files = [];
      this.changed(null);
    },
    remove(index) {
      this.previousFiles.splice(index, 1);
      this.files = this.previousFiles;
      this.changed(this.files);
    },
    submit() {
      this.changed(this.files);
      this.$emit('next');
    },
  },
};
</script>
