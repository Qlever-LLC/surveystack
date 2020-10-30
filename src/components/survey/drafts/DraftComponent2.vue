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
  created() {
    const { survey, submission } = this;
    this.$store.dispatch('draft/init', { survey, submission });
  },
};
</script>
