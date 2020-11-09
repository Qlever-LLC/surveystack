<template>
  <v-container>
    <app-draft-toolbar
      :group="groupPath"
      :required="control && control.options && control.options.required"
      :anon="control && control.options && control.options.redacted"
      :showOverviewIcon="true"
      :questionNumber="$store.getters['draft/questionNumber']"
      @showOverviewClicked="showOverview = !showOverview"
    />
    <v-navigation-drawer
      v-if="showOverview"
      v-model="showOverview"
      clipped
      right
      touchless
      stateless
      class="grey lighten-4 navigation-container"
    >
      <app-draft-overview
        ref="overview"
        :survey="survey"
        :submission="submission"
        :position="[0]"
        :group="groupPath"
        :compounds="$store.getters['draft/compounds']"
        @goto="goto"
      />
    </v-navigation-drawer>

    <v-row
      class="mt-6"
      v-if="!showOverview"
    >
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

        <v-card
          class="pa-3"
          color="grey lighten-4"
        >
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

      </v-col>

    </v-row>

    <app-draft-footer
      class="px-4 grey lighten-5 footer-container"
      :showPrev="!$store.getters['draft/atStart']"
      :enableNext="true"
      :showSubmit="false"
      :showNav="true"
      @next="$store.dispatch('draft/next')"
      @prev="$store.dispatch('draft/prev')"
      @submit="$store.dispatch('draft/next')"
    />

  </v-container>
</template>

<script>
import appControl from './Control.vue';
import appDraftFooter from '@/components/survey/drafts/DraftFooter.vue';
import appDraftOverview from '@/components/survey/drafts/DraftOverview2.vue';
import appDraftToolbar from '@/components/survey/drafts/DraftToolbar.vue';


export default {
  components: {
    appControl,
    appDraftFooter,
    appDraftOverview,
    appDraftToolbar,
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
    groupPath() {
      return this.$store.getters['draft/groupPath'];
    },
    showOverview: {
      get() {
        return this.$store.getters['draft/showOverview'];
      },
      set(v) {
        this.$store.dispatch('draft/showOverview', v);
      },
    },
  },
  methods: {
    goto(path) {
      this.$store.dispatch('draft/goto', path);
      this.showOverview = false;
    },
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

<style scoped>
.navigation-container {
  position: absolute;
  width: 100% !important;
  z-index: 4;
  height: calc(100% - 68px);
  max-height: calc(100% - 68px);
  overflow: auto;
  /* grid-column: 1;
  grid-row: 1; */
}
</style>
