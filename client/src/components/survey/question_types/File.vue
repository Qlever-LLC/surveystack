<template>
  <div>
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <app-control-hint :value="control.hint" />
    <v-row>
      <div class="col-12">
        <v-file-input
          v-model="newFiles"
          :accept="
            control.options.source.types && control.options.source.types.length > 0
              ? control.options.source.types.join()
              : ''
          "
          outlined
          :multiple="control.options.source.allowMultiple"
          :chips="control.options.source.allowMultiple"
          :label="control.hint"
          @keyup.enter.prevent="submit"
          @click:clear="clear"
          @change="filesChanged"
          color="focus"
          data-test-id="input"
        >
          <template v-slot:selection="{ text, index, file }">
            <v-chip
              v-for="(f, idx) in allFiles"
              :key="f.name"
              text-color="white"
              color="grey"
              close
              @click:close="remove(idx)"
              :data-test-id="'file_' + idx"
            >
              {{ f.name }}
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
      newFiles: new File([''], 'dummyfile'), //workaround to make sure v-slot:selection is shown even if newFiles is empty because file chooser has not been used yet
      allFiles: this.value || [],
    };
  },
  computed: {},
  watch: {},
  methods: {
    async filesChanged(e) {
      this.allFiles.push(...this.newFiles);
      this.changed(this.allFiles.length ? this.allFiles : null);
    },
    clear() {
      this.allFiles = [];
      this.changed(null);
    },
    remove(index) {
      this.allFiles.splice(index, 1);
      this.changed(this.allFiles);
    },
    submit() {
      this.changed(this.allFiles);
      this.$emit('next');
    },
  },
};
</script>
