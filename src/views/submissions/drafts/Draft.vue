
<template>
  <div id="relative-wrapper">
    <div id="draft-root">
      <div
        id="draft-container"
        :key="'container-'+index"
        v-if="submission && survey"
        style="border-right: 1px solid #AAA; border-left: 1px solid #AAA"
      >
        <draft-toolbar
          :showOverview="showOverview"
          :showOverViewIcon="!atEnd"
          :questionNumber="questionNumber"
          v-if="!showOverview && index < positions.length"
          @showOverviewClicked="showOverview = !showOverview"
        />
        <draft-title
          v-if="!showOverview && index < positions.length"
          :breadcrumbs="mbreadcrumbs"
        />

        <transition :name="slide">
          <v-container
            id="draft-body"
            style="max-width: 800px; height: 100%;"
          >
            <component
              v-if="!atEnd"
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
          </v-container>
        </transition>
      </div>
      <v-navigation-drawer
        v-if="survey"
        id="navigation-container"
        v-model="showOverview"
        clipped
        right
        touchless
        stateless
      >
        <draft-overview
          :survey="survey"
          :submission="submission"
          :position="this.positions[this.index]"
          @navigate="(pos) => navigate(pos)"
        ></draft-overview>
      </v-navigation-drawer>
    </div>

    <draft-footer
      class="px-4"
      id="footer-container"
      :showPrev="!atStart"
      :enableNext="mShowNext"
      :showSubmit="atEnd"
      :showNav="mShowNav"
      @next="handleNext"
      @prev="handlePrevious"
      @submit="handleNext"
    />
  </div>
</template>


<script>
import _ from 'lodash';
import api from '@/services/api.service';

import inputText from '@/components/survey/question_types/TextInput.vue';
import inputNumeric from '@/components/survey/question_types/NumberInput.vue';
import inputLocation from '@/components/survey/question_types/Map.vue';
import group from '@/components/survey/question_types/Group.vue';
import draftOverview from '@/components/survey/drafts/DraftOverview.vue';
import draftFooter from '@/components/survey/drafts/DraftFooter.vue';
import draftToolbar from '@/components/survey/drafts/DraftToolbar.vue';
import draftTitle from '@/components/survey/drafts/DraftTitle.vue';

import appMixin from '@/components/mixin/appComponent.mixin';

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
    draftFooter,
    draftToolbar,
    draftTitle,
  },
  data() {
    return {
      submission: null,
      survey: null,
      control: null,
      submissionData: null,
      positions: [],
      index: 0,
      mShowNav: true,
      mShowNext: true,
      activeVersion: 0,
      value: null,
      showOverview: false,
      slide: 'slide-in',
    };
  },
  computed: {
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
      if (this.atOverview || this.atEnd) {
        return [];
      }
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
    navigate(pos) {
      this.slide = 'slide-out';
      console.log('navigating', pos);
      this.showNav(true);
      this.showNext(true);

      this.index = this.positions.findIndex(p => _.isEqual(p, pos));
      console.log(this.index);
      this.submissionData = getInstanceData(this.submission);
      this.control = getControl(this.submission.data, pos);
      this.value = this.control.value;
      this.showOverview = false;

      this.calculateControl();
    },
    handleNext() {
      this.slide = 'slide-in';
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
          this.showOverview = true;
          return;
        }

        this.showOverview = false;


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
      this.slide = 'slide-out';

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

        this.showOverview = false;

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
    db.openDb();
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
#relative-wrapper {
  position: absolute;
  max-width: 100%;
  height: 100%;
  width: 100%;
  margin: 0px;
  padding: 0px !important;
  min-height: 100%;
}

#footer-container {
  width: 100%;
  border-top: 1px solid #eee;
  height: 68px;
  position: fixed;
  bottom: 0px;
  left: 0px;
}

#draft-root {
  position: absolute;
  max-width: 100vw;
  height: calc(100% - 110px);
  overflow: auto;
  overflow-x: hidden;
  width: 100vw;
  margin: 0px;
  padding: 0px !important;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr auto;
}

#draft-container {
  position: relative;
  height: 100%;
  width: 100%;
  margin: 0px;
  padding: 0px !important;
  max-height: 100%;
  overflow: auto;

  grid-column: 1;
  grid-row: 1;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr;
  will-change: transform;
}

#navigation-container {
  position: relative;
  width: 100% !important;
  z-index: 4;
  max-height: 100%;
  overflow: auto;

  grid-column: 1;
  grid-row: 1;
}

#draft-toolbar {
  grid-column: 1;
  grid-row: 1;
}

#draft-breadcrumbs {
  grid-column: 1;
  grid-row: 2;
}

#draft-body {
  max-height: 100%;
  overflow: auto;
  grid-column: 1;
  grid-row: 3;
}
</style>


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

#top-level-container {
  padding-left: 0px !important;
  padding-right: 0px !important;
}

.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.5s;
}

.slide-in-enter {
  transform: translate3d(100vw, 0, 0);
}
.slide-in-leave-to {
  position: fixed;
  transform: translate3d(-100vw, 0, 0);
}
.slide-in-leave {
  transform: translate3d(0%, 0, 0);
}
.slide-in-enter-to {
  position: fixed;
  transform: translate3d(0%, 0, 0);
}

.slide-out-enter-active,
.slide-out-leave-active {
  transition: all 0.5s;
}

.slide-out-enter {
  transform: translate3d(-100vw, 0, 0);
}
.slide-out-leave-to {
  position: fixed;
  transform: translate3d(100vw, 0, 0);
}
.slide-out-leave {
  transform: translate3d(0%, 0, 0);
}
.slide-out-enter-to {
  position: fixed;
  transform: translate3d(0%, 0, 0);
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
