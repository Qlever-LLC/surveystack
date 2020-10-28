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
      <v-col>
        <v-btn @click="$store.dispatch('draft/prev')">PREV</v-btn>
        <v-btn @click="$store.dispatch('draft/next')">NEXT</v-btn>
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
    submissionStringified() {
      return JSON.stringify(this.submission, null, 2);
    },
    surveyStringified() {
      return JSON.stringify(this.survey, null, 2);
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
