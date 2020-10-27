<template>
  <v-container class="mt-12">
    <v-row class="mt-6">
      <v-col>
        <v-textarea
          :value="surveyStringified"
          label="survey"
          rows="30"
          outlined
        />
      </v-col>
      <v-col>
        <v-textarea
          :value="submissionStringified"
          label="submission"
          rows="30"
          outlined
        />
      </v-col>
      <!--
      <v-col>
        <div
          v-for="controlValueKey in controlValueKeys"
          :key="controlValueKey"
        >
          <v-text-field
            :label="controlValueKey"
            :value="$store.getters['draft/property'](controlValueKey)"
            @input="(v) => $store.dispatch('draft/setProperty', {key: controlValueKey, value: v})"
          />
        </div>
      </v-col>
      -->
      <v-col>
        <app-control
          :path="path"
          :control="control"
        />
        <v-btn @click="$store.dispatch('draft/prev')">PREV</v-btn>
        <v-btn @click="$store.dispatch('draft/next')">NEXT</v-btn>
      </v-col>

    </v-row>
    <div>
      {{positions}}
    </div>
    <div>
      {{flatNames}}
    </div>
    <div>
      {{control}}
    </div>

  </v-container>
</template>

<script>
import * as utils from '@/utils/surveys';

import appControl from './Control.vue';


export default {
  components: {
    appControl,
  },
  props: {
    survey: { type: Object },
    submission: { type: Object },
  },
  computed: {
    name: {
      get() {
        return this.$store.getters['draft/property']('data.text_1.value');
      },
      set(v) {
        this.$store.dispatch('draft/setProperty', { path: 'data.text_1.value', value: v });
      },

    },
    submissionStringified() {
      return JSON.stringify(this.submission, null, 2);
    },
    surveyStringified() {
      return JSON.stringify(this.survey, null, 2);
    },
    age: {
      get() {
        return this.$store.getters['draft/property']('data.number_2.value');
      },
      set(v) {
        const number = Number(v) || null;
        this.$store.dispatch('draft/setProperty', { path: 'data.number_2.value', value: number });
      },
    },
    positions() {
      return utils.getSurveyPositions(this.survey, this.activeVersion);
    },
    controls() {
      return this.survey.revisions.find(revision => revision.version === this.activeVersion)
        .controls;
    },
    activeVersion() {
      return this.submission.meta.survey.version;
    },
    flatNames() {
      return this.positions.map(position => utils.getFlatName(this.controls, position));
    },
    controlKeys() {
      return this.flatNames.map(flatName => `data.${flatName}`);
    },
    controlValueKeys() {
      return this.flatNames.map(flatName => `data.${flatName}.value`);
    },
    path() {
      return this.$store.getters['draft/path'];
    },
    control() {
      return this.$store.getters['draft/control'];
    },
  },
  created() {
    const { survey, submission } = this;
    this.$store.dispatch('draft/init', { survey, submission });
  },
};
</script>
