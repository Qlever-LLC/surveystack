<template>
  <v-container class="mt-12">
    <div class="d-flex">
      <v-btn
        @click="viewSurvey = !viewSurvey"
        class="mr-2"
      >Survey</v-btn>
      <v-btn @click="viewSubmission = !viewSubmission">Submission</v-btn>
    </div>
    <v-row class="mt-6">
      <v-col v-if="viewSurvey">
        <v-textarea
          :value="surveyStringified"
          label="survey"
          rows="30"
          outlined
        />
      </v-col>
      <v-col v-if="viewSubmission">
        <v-textarea
          :value="submissionStringified"
          label="submission"
          rows="30"
          outlined
        />
      </v-col>
      <v-col>

        <div class="d-flex">
          <v-text-field v-model="gotoPath" />
          <v-btn @click="$store.dispatch('draft/goto', gotoPath)">GOTO</v-btn>
        </div>

        <v-btn @click="$store.dispatch('draft/prev')">PREV</v-btn>
        <v-btn @click="$store.dispatch('draft/next')">NEXT</v-btn>
        <app-control
          :path="path"
          :control="control"
        />
        <v-btn @click="$store.dispatch('draft/prev')">PREV</v-btn>
        <v-btn @click="$store.dispatch('draft/next')">NEXT</v-btn>
        <br />
        <v-btn
          @click="submit"
          class="my-2"
          block
        >SUBMIT</v-btn>
      </v-col>

    </v-row>

    <div>
      {{control}}
    </div>

  </v-container>
</template>

<script>
import appControl from './Control.vue';

export default {
  components: {
    appControl,
  },
  props: {
    survey: { type: Object },
    submission: { type: Object },
  },
  data() {
    return {
      gotoPath: '',
      viewSurvey: false,
      viewSubmission: false,
    };
  },
  computed: {
    submissionStringified() {
      return JSON.stringify(this.submission, null, 2);
    },
    surveyStringified() {
      return JSON.stringify(this.survey, null, 2);
    },
    path() {
      return this.$store.getters['draft/path'];
    },
    control() {
      return this.$store.getters['draft/control'];
    },
  },
  methods: {
    async submit() {
      this.$emit('submit', {
        payload: this.submission,
      });
    },
  },
  created() {
    const { survey, submission } = this;
    this.$store.dispatch('draft/init', { survey, submission });
  },
};
</script>
