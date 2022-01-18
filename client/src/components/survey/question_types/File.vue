<template>
  <div>
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <app-control-hint :value="control.hint" />
    <v-row>
      <div class="col-12">
        <v-file-input
          v-model="currFiles"
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
              v-for="f in allFiles"
              :key="f.name"
              text-color="white"
              color="grey"
              close
              @click:close="clear(index)"
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

export default {
  mixins: [baseQuestionComponent],
  props: {},
  data() {
    return {
      currFiles: [],
      allFiles: [],
    };
  },
  computed: {},
  watch: {},
  methods: {
    async filesChanged(e) {
      this.allFiles.push(...this.currFiles);
      this.changed(this.allFiles.length ? this.allFiles : null);
    },
    async clear(e) {
      this.currFiles = [];
      this.allFiles = [];
    },
  },
};
</script>
