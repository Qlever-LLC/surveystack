<template>
  <div>
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <app-control-hint :value="control.hint" />
    <v-row>
      <div class="col-12">
        <v-file-input
          id="fileChooser"
          name="fileChooser"
          outlined
          show-size
          :counter="control.options.source.allowMultiple"
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
    </v-row>

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
          if (this.previousFiles.length === 0) {
            this.previousFiles.push(file);
          } else {
            const index = this.previousFiles.findIndex((x) => x.name === file.name);
            if (index >= 0) {
              this.previousFiles.splice(index, 1);
            }
            this.previousFiles.push(file);
          }
        });
        this.files = this.previousFiles;
      }

      this.changed(this.files.length ? this.files : null);
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
