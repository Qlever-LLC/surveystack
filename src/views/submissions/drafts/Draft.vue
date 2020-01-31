
<template>
  <div
    id="top-level-container"
    class="my-n3 py-4"
    v-if="submission && survey"
  >
    <v-toolbar
      color="grey lighten-4"
      flat
      tile
    >
      <v-toolbar-title class="d-flex" v-if="!showOverview">
        <div class="infos grey--text text--darken-2">
          <div class="d-flex">
            <span class="number-chip mr-2">{{ questionNumber }}</span>
          </div>
        </div>
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <v-btn
        icon
        @click="showOverview = !showOverview"
      >
        <v-icon>mdi-view-list</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
    </v-toolbar>

    <div class="ml-5 mt-1" v-if="!showOverview">
      <v-chip
        dark
        small
        color="red"
        class="mr-0 mr-1"
        v-if="mbreadcrumbs.length > 0"
      ><span
          v-for="(crumb, ci) in mbreadcrumbs"
          :key="`bread_${ci}`"
        >{{ crumb }} <span
            class="mr-1"
            v-if="ci < mbreadcrumbs.length - 1"
          >&gt;</span></span></v-chip>
    </div>
    <v-container
      class="mt-n3"
      id="question-container"
    >
      <v-row
        class="flex-grow-0 flex-shrink-1 pl-2 pr-2"
        v-if="!atOverview"
      >

      </v-row>

      <v-row
        justify="center"
        align="center"
        class="px-2"
      >
        <draft-overview
          class="tall"
          v-if="atEnd || showOverview"
          :survey="survey"
          :submission="submission"
        ></draft-overview>

        <component
          v-else
          class="tall"
          :key="breadcrumbs.join('.')"
          :is="control.type"
          :control="control"
          :value="value"
          @eval="eval"
          @changed="setValue"
          @show-nav="showNav(true)"
          @hide-nav="showNav(false)"
          @next="handleNext"
          @show-next="showNext(true)"
          @hide-next="showNext(false)"
        />

      </v-row>

      <div
        v-if="mShowNav"
        class="font-weight-medium footer"
      >
        <v-container class="pa-0">
          <v-row>
            <v-col
              class="text-center"
              cols="6"
            >
              <v-btn
                v-show="!atStart"
                @click="handlePrevious"
                class="full"
                outlined
                depressed
                large
                color="primary"
              >
                Previous
              </v-btn>
            </v-col>

            <v-col
              v-if="atEnd"
              class="text-center"
              cols="6"
            >
              <v-btn
                :disabled="!mShowNext"
                @click="handleNext"
                class="full"
                depressed
                large
                color="primary"
              >
                Submit
              </v-btn>
            </v-col>

            <v-col
              v-else
              class="text-center"
              cols="6"
            >
              <v-btn
                :disabled="!mShowNext"
                @click="handleNext"
                @keyup.enter="handleNext"
                class="full"
                depressed
                large
                color="primary"
              >
                Next
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </div>
    </v-container>
  </div>
</template>


<script>
import api from '@/services/api.service';

import inputText from '@/components/survey/question_types/TextInput.vue';
import inputNumeric from '@/components/survey/question_types/NumberInput.vue';
import inputLocation from '@/components/survey/question_types/Map.vue';
import group from '@/components/survey/question_types/Group.vue';
import draftOverview from '@/components/survey/DraftOverview.vue';
import appMixin from '@/components/mixin/appCoomponent.mixin';

import * as db from '@/store/db';


import {
  getControl,
  getBreadcrumbs,
  getInstanceData,
  getSurveyPositions,
  compileSandboxSingleLine,
  createInstance,
  createInstancePayload,
} from '@/utils/surveys';

export default {
  mixins: [appMixin],
  components: {
    inputText,
    inputNumeric,
    inputLocation,
    group,
    draftOverview,
  },
  data() {
    return {
      submission: null,
      survey: null,
      control: null,
      submissionData: null,
      positions: null,
      index: 0,
      mShowNav: true,
      mShowNext: true,
      activeVersion: 0,
      value: null,
      showOverview: false,
    };
  },
  computed: {
    totalQuestions() {
      return 13;
    },
    atStart() {
      return this.index === 0;
    },
    atOverview() {
      return this.index >= this.positions.length - 1;
    },
    atEnd() {
      return this.index >= this.positions.length;
    },
    showInput() {
      if (this.control.type === 'group') {
        return false;
      }

      return true;
    },
    questionNumber() {
      const edited = this.positions[this.index].map(value => value + 1);
      return edited.join('.');
    },
    mbreadcrumbs() {
      const b = getBreadcrumbs(
        this.survey.versions.find(item => item.version === this.activeVersion),
        this.positions[this.index],
      );

      const ret = b.splice(0, b.length - 1);
      return ret;
    },
    breadcrumbs() {
      return getBreadcrumbs(
        this.survey.versions.find(item => item.version === this.activeVersion),
        this.positions[this.index],
      );
    },
    example() {
      return {
        hello: 'world',
      };
    },
    draftId() {
      return this.$route.params && this.$route.params.id;
    },
    surveyId() {
      return this.$route.query && this.$route.query.survey;
    },
  },
  methods: {
    eval() { },
    showNav(visible) {
      this.mShowNav = visible;
    },
    showNext(visible) {
      this.mShowNext = visible;
    },
    setValue(v) {
      // TODO change modified timestamp, persist
      console.log('setValue', v);
      this.$set(this.control, 'value', v);
      this.value = v;
      this.submission.meta.modified = new Date().getTime();
      this.persist();
      // Why do we need to force update?
      this.$forceUpdate();
    },
    handleNext() {
      this.showNav(true);
      this.showNext(true);

      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (this.atEnd) {
          const payload = createInstancePayload(
            this.submission,
            this.survey.versions[this.activeVersion],
          );
          console.log('payload', payload);
          this.submit(payload);
          return;
        }

        if (this.atOverview) {
          this.index++;
          return;
        }


        this.index++;
        this.submissionData = getInstanceData(this.submission);
        this.control = getControl(this.submission.data, this.positions[this.index]);
        this.value = this.control.value;

        if (this.control.type === 'group') {
          // eslint-disable-next-line no-continue
          continue;
        }

        this.calculateControl();
        return;
      }
    },
    handlePrevious() {
      this.showNav(true);
      this.showNext(true);

      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (this.atStart) {
          return;
        }
        this.index--;
        this.control = getControl(this.submission.data, this.positions[this.index]);
        this.value = this.control.value;

        if (this.control.type === 'group') {
          // eslint-disable-next-line no-continue
          continue;
        }

        return;
      }
    },
    calculateControl() {
      if (
        !this.control.options.calculate
        || this.control.options.calculate === ''
      ) {
        return;
      }
      const sandbox = compileSandboxSingleLine(this.control.options.calculate);
      this.control.value = sandbox({ data: this.submissionData });
      this.value = this.control.value;
      console.log(this.control.value);
    },
    questions() {
      if (!this.surveyPositions) {
        return [];
      }

      return this.surveyPositions.map(pos => ({
        number: pos.map(v => v + 1).join('.'),
        control: this.controlFromPosition(pos),
      }));
    },
    persist() {
      db.persistSurveyResult(this.submission);
    },
    async submit(payload) {
      try {
        await api.post('/submissions', payload);
        this.$router.push('/surveys/browse');
      } catch (error) {
        console.log(error);
      }
    },
    // getInitialSubmissionState({
    //   survey,
    //   version,
    //   submission,
    //   index = 0,
    // }) {
    //   const positions = getSurveyPositions(survey, version);
    //   const control = getControl(submission.data, positions[index]);
    //   return {
    //     positions,
    //     submissionData: getInstanceData(this.submission),
    //     control,
    //     value: control.value,
    //     breadcrumbs: getBreadcrumbs(survey.versions[version], positions[index]),
    //   };
    // },
  },
  // watch: {
  //   control(newControl, oldControl) {
  //     //
  //   },
  // },
  async created() {
    /**
       * Page will either be loaded with query parameter for survey definition ID or
       * route parameter for draft ID
       */
    const { id: draftId } = this.$route.params;
    const { survey: surveyId } = this.$route.query;

    const isNewSubmission = !draftId;

    if (draftId) {
      /** Either fetch all submissions then use getter, or use GET_SUBMISSION action, which automatically does this. */
      // await this.$store.dispatch('submissions/fetchSubmissions');
      // this.$store.getters['submissions/getSubmission'](draftId);
      this.submission = await this.$store.dispatch('submissions/getSubmission', draftId);
      // TODO: handle submission not found, set error on page
    }

    this.survey = await this.$store.dispatch(
      'surveys/fetchSurvey',
      surveyId || (this.submission && this.submission.survey),
    );

    /** TODO: survey definition versions need the ability to be archived, so we can't just use an index
       * of `survey.versions.length` to reference which version we're using. Instead, each survey definition
       * in the `survey.versions` array needs to a have a version attribute.
       * */
    this.activeVersion = isNewSubmission
      ? this.survey.latestVersion
      : this.submission.meta.version;

    if (!draftId) {
      this.submission = createInstance(this.survey, this.activeVersion);
    }

    /** Should this be broken out into method? */
    this.index = 0;
    this.positions = getSurveyPositions(this.survey, this.activeVersion);
    this.submissionData = getInstanceData(this.submission);
    this.control = getControl(this.submission.data, this.positions[this.index]);
    this.value = this.control.value;

    this.setNavbarContent({
      title: this.survey.name,
      subtitle: `<span><span id="question-title-chip">Version ${this.activeVersion}</span></span> <span id="question-title-chip">${this.positions.length} Questions</span>`,
    });
  },
};
</script>

<style scoped>
.full {
  width: 100%;
}

.count {
  flex-grow: 0;
}

.title {
  /* align-items: center; */
  line-height: 1.5rem !important;
  width: 100%;
  display: flex;
  justify-content: space-between;
  flex-wrap: nowrap;
  margin: 0.2rem 0;
}

.inner-title {
  flex-basis: 0;
  flex-grow: 1;
}

.pack {
  flex-basis: 0 !important;
}

.footer {
  border-top: 1px solid #ccc;
  background: #fff;
  margin: 0;
  border-radius: 0;
  -webkit-box-align: center;
  align-items: center;
  display: flex;
  -webkit-box-flex: 0 !important;
  flex: 0 1 auto !important;
  flex-wrap: wrap;
  padding: 6px 16px;
  transition-duration: 0.2s;
  transition-property: background-color, left, right;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 6;
  position: fixed;
  left: 0px;
  right: 0px;
  bottom: 0px;
}

.tall {
  margin-bottom: 70px;
}

.app-chip {
  display: inline-flex;
  background-color: white;
  color: #ff5722;
  border-radius: 0.4rem;
  font-weight: bold;
  font-size: 80%;
  padding: 0.2rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
}

.number-chip {
  display: inline-flex;
  border: 2px solid #ff5722;
  background-color: white;
  color: #ff5722;
  border-radius: 2rem;
  line-height: 2rem;
  font-weight: bold;
  font-size: 2rem;
  padding: 0.4rem;
  padding-left: 0.8rem;
  padding-right: 0.9rem;
}

#top-level-container {
  padding-left: 0px !important;
  padding-right: 0px !important;
}
</style>

<style>
#question-title-chip {
  display: inline-flex;
  background-color: white;
  color: #ff5722;
  border-radius: 0.4rem;
  font-weight: bold;
  font-size: 80%;
  padding: 0.2rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
}
</style>
