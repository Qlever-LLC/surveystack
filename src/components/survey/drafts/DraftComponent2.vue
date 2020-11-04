<template>
  <v-container class="mt-12">
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

        <v-card class="pa-3">
          <div class="d-flex pb-2 justify-center">
            <v-checkbox
              label="Survey"
              dense
              hide-details
              class="mt-0 mx-3"
              v-model="viewSurvey"
            />
            <v-checkbox
              label="Submission"
              dense
              hide-details
              class="mt-0 mx-3"
              v-model="viewSubmission"
            />
          </div>
          <div class="d-flex justify-space-between align-center">
            <v-btn
              @click="$store.dispatch('draft/prev')"
              class="mr-4"
            >PREV</v-btn>
            <v-btn
              @click="$store.dispatch('draft/next')"
              class="mr-4"
            >NEXT</v-btn>
            <v-text-field
              v-model="gotoPath"
              dense
              hide-details
              class="mr-4"
              label="path"
              outlined
            />
            <v-btn
              @click="$store.dispatch('draft/goto', gotoPath)"
              class="mr-4"
            >GOTO</v-btn>
            <v-btn @click="submit">SUBMIT</v-btn>
          </div>
        </v-card>

        <app-control
          :path="path"
          :control="control"
        />
        <v-card class="pa-3">
          <div class="d-flex justify-space-between align-center">
            <v-btn
              @click="$store.dispatch('draft/prev')"
              class="mr-4"
            >PREV</v-btn>
            <v-btn
              @click="$store.dispatch('draft/next')"
              class="mr-4"
            >NEXT</v-btn>
            <v-text-field
              v-model="gotoPath"
              dense
              hide-details
              class="mr-4"
              label="path"
              outlined
            />
            <v-btn
              @click="$store.dispatch('draft/goto', gotoPath)"
              class="mr-4"
            >GOTO</v-btn>
            <v-btn @click="submit">SUBMIT</v-btn>
          </div>
        </v-card>
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
