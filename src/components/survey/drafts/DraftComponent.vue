<template>
  <div id="relative-wrapper">

    <div
      class="full fill-height d-flex justify-center align-center"
      style="position: absolute;"
      v-if="controls.length === 0"
    >
      <div class="d-flex flex-column">
        <v-icon
          large
          color="blue"
        >mdi-file-multiple</v-icon>
        <v-alert
          type="info"
          text
          color="blue"
          class="ma-4"
        >No Questions yet</v-alert>
      </div>
    </div>

    <div
      id="draft-container"
      v-if="submission && survey"
    >
      <draft-toolbar
        :showOverview="showOverview"
        :showOverviewIcon="!atEnd"
        :questionNumber="questionNumber"
        v-if="!showOverview && index < positions.length"
        @showOverviewClicked="showOverview = !showOverview"
      />
      <draft-title
        v-if="!showOverview && index < positions.length"
        :breadcrumbs="mbreadcrumbs"
      />
      <div style="position: relative; width: 100%; height: 100%;">
        <transition :name="slide">
          <div
            id="transition-container"
            :key="'container-'+index"
          >
            <v-container
              id="draft-body"
              style="max-width: 50rem; height: 100%;"
            >
              <v-row
                class="flex-grow-0 flex-shrink-1 pl-2 pr-2"
                v-if="!atOverview"
              />
              <v-row
                justify="center"
                align="center"
                class="px-2"
                style="height: 100%; margin-left: 0px; margin-right: 0px;"
              >
                <component
                  v-if="control && !atEnd"
                  class="tall"
                  :key="'question_'+index"
                  :is="componentName"
                  :control="control"
                  :value="value"
                  :index="index"
                  :submission="submission"
                  :meta="submissionField.meta"
                  @eval="eval"
                  @changed="setValue"
                  @setStatus="setStatus"
                  @setContext="setContext"
                  @setRenderQueue="setRenderQueue"
                  @show-nav="showNav(true)"
                  @hide-nav="showNav(false)"
                  @next="handleNext"
                  @show-next="showNext(true)"
                  @hide-next="showNext(false)"
                />
              </v-row>
            </v-container>
          </div>
        </transition>
      </div>
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
        ref="overview"
        :survey="survey"
        :submission="submission"
        :position="positions[index]"
        @navigate="navigate"
      />
    </v-navigation-drawer>

    <draft-footer
      class="px-4"
      id="footer-container"
      :showPrev="!atStart"
      :enableNext="mShowNext && controls.length > 0"
      :showSubmit="atEnd && controls.length > 0"
      :showNav="mShowNav"
      @next="handleNext"
      @prev="handlePrevious"
      @submit="handleNext"
    />
  </div>
</template>

<script>
/* eslint-disable no-continue */

import _ from 'lodash';
import moment from 'moment';

import draftOverview from '@/components/survey/drafts/DraftOverview.vue';
import draftFooter from '@/components/survey/drafts/DraftFooter.vue';
import draftToolbar from '@/components/survey/drafts/DraftToolbar.vue';
import draftTitle from '@/components/survey/drafts/DraftTitle.vue';


import appMixin from '@/components/mixin/appComponent.mixin';

import * as utils from '@/utils/surveys';
import submissionUtils from '@/utils/submissions';
import * as codeEvaluator from '@/utils/codeEvaluator';


export default {
  model: {
    prop: 'submission',
    event: 'change',
  },
  props: {
    submission: {
      type: Object,
      required: true,
    },
    survey: {
      type: Object,
      required: true,
    },
  },
  mixins: [appMixin],
  components: {
    draftOverview,
    draftFooter,
    draftToolbar,
    draftTitle,
  },
  data() {
    return {
      control: null,
      index: 0,
      mShowNav: true,
      mShowNext: true,
      value: null,
      showOverview: false,
      slide: 'slide-in',
    };
  },
  computed: {
    positions() {
      return utils.getSurveyPositions(this.survey, this.activeVersion);
    },
    position() {
      return this.positions[this.index];
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
    questionNumber() {
      const edited = this.positions[this.index].map(value => value + 1);
      return edited.join('.');
    },
    mbreadcrumbs() {
      if (this.atOverview || this.atEnd) {
        return [];
      }
      const b = utils.getBreadcrumbs(
        this.survey.revisions.find(revision => revision.version === this.activeVersion),
        this.position,
      );

      const ret = b.splice(0, b.length - 1);
      return ret;
    },
    breadcrumbs() {
      return utils.getBreadcrumbs(
        this.survey.revisions.find(revision => revision.version === this.activeVersion),
        this.position,
      );
    },
    componentName() {
      let { type } = this.control;
      type = type.charAt(0).toUpperCase() + type.slice(1);
      return `appControl${type}`;
    },
    controls() {
      // TODO: handle version not found
      return this.survey.revisions.find(revision => revision.version === this.activeVersion).controls;
    },
    activeVersion() {
      return this.submission.meta.survey.version;
    },
    submissionField() {
      return submissionUtils.getSubmissionField(this.submission, this.survey, this.position);
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
      // local
      this.value = v;
      // submission
      const modified = moment().toISOString();
      this.submission.meta.dateModified = modified;
      console.log('setting value', this.sumissionField, v);
      this.submissionField.value = v;
      this.submissionField.meta.dateModified = modified;
      this.$emit('change', this.submission);
      this.persist();
    },
    setStatus({ type, message }) {
      const field = submissionUtils.getSubmissionField(this.submission, this.survey, this.position);
      // Need to reassign field.meta here to trigger rerender for Script Question type when status changes
      // since Vue only performs shallow comparison.
      field.meta = {
        ...field.meta,
        status: type,
        statusMessage: message,
      };
      this.$emit('change', this.submission);
      this.persist();
    },
    setContext(context) {
      const field = submissionUtils.getSubmissionField(this.submission, this.survey, this.position);
      field.meta.context = context;
      // TODO: update meta modified;
      this.$emit('change', this.submission);
      this.persist();
    },
    setRenderQueue(queue) {
      const field = submissionUtils.getSubmissionField(this.submission, this.survey, this.position);
      field.meta.renderQueue = queue;
      this.$emit('change', this.submission);
      this.persist();
    },
    navigate(pos) {
      this.slide = 'slide-out';
      console.log('navigating', pos);
      this.showNav(true);
      this.showNext(true);

      this.index = this.positions.findIndex(p => _.isEqual(p, pos));
      this.control = utils.getControl(this.controls, pos);
      this.value = submissionUtils.getSubmissionField(this.submission, this.survey, pos).value;
      this.showOverview = false;

      this.calculateControl();
    },
    async handleNext() {
      console.log('handleNext()');
      this.slide = 'slide-in';
      this.showNav(true);
      this.showNext(true);
      await this.calculateRelevance();
      await this.calculateApiCompose();


      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (this.atEnd) {
          // eslint-disable-next-line no-await-in-loop
          this.submit(this.submission);
          return;
        }

        if (this.atOverview) {
          this.index++;
          this.showOverview = true;
          return;
        }

        this.showOverview = false;


        this.index++;

        const rel = utils.isRelevant(this.submission, this.survey, this.index, this.positions);

        if (rel === false) {
          continue;
        }

        this.control = utils.getControl(this.controls, this.position);
        const field = submissionUtils.getSubmissionField(this.submission, this.survey, this.position);

        this.value = field.value;


        if (this.control.type === 'group') {
          continue;
        }

        this.calculateControl();
        return;
      }
    },
    async handlePrevious() {
      console.log('handlePrevious()');
      await this.calculateRelevance();

      this.slide = 'slide-out';

      this.showNav(true);
      this.showNext(true);

      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (this.atStart) {
          return;
        }
        this.index--;

        const rel = utils.isRelevant(this.submission, this.survey, this.index, this.positions);

        if (rel === false) {
          continue;
        }

        this.control = utils.getControl(this.controls, this.position);
        this.value = submissionUtils.getSubmissionField(this.submission, this.survey, this.position).value;

        this.showOverview = false;

        if (this.control.type === 'group') {
          // eslint-disable-next-line no-continue
          continue;
        }

        return;
      }
    },
    calculateControl() {
      if (!this.control.options.calculate.enabled) {
        return;
      }

      if (
        !this.control.options.calculate
        || this.control.options.calculate === ''
      ) {
        return;
      }
      const sandbox = utils.compileSandboxSingleLine(this.control.options.calculate);
      this.control.value = sandbox({ data: this.submission.data });
      this.value = this.control.value;
      console.log('calculated', this.control.value);
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
      this.$emit('persist', { submission: this.submission });
    },
    async submit(payload) {
      this.$emit('submit', { payload });
    },
    async calculateRelevance() {
      return codeEvaluator.calculateRelevance(this.survey, this.submission, this.positions, this.controls);
    },
    async calculateApiCompose() {
      console.log('calculating api compose');
      return codeEvaluator.calculateApiCompose(this.survey, this.submission, this.positions, this.controls);
    },
  },

  async created() {
    console.log('submission', this.submission);
    /** Should this be broken out into method? */
    console.log('pos', this.position);
    console.log('survey', this.survey);
    if (!this.position) {
      return;
    }


    this.control = utils.getControl(this.controls, this.position);
    this.value = submissionUtils.getSubmissionField(this.submission, this.survey, this.position).value;

    this.setNavbarContent({
      title: this.survey.name,
      subtitle: `
        <span><span class="question-title-chip">Version ${this.activeVersion}</span></span>
        <span class="ml-2">${this.positions.length} Question${this.positions.length > 1 || this.positions.length < 1 ? 's' : ''}</span>
      `,
    });
  },
  watch: {
    async showOverview() {
      await this.calculateRelevance();
      this.$refs.overview.refresh();
    },
    submission: {
      async handler() {
        // await this.calculateRelevance();
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
#relative-wrapper {
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
  overflow: hidden;
  position: absolute;
  bottom: 0px;
  left: 0px;
}

#draft-container {
  position: absolute;
  width: 100%;
  margin: 0px;
  padding: 0px !important;
  overflow: auto;
  overflow-x: hidden;
  bottom: 68px;
  top: 0px;
  left: 0px;
  /*
  height: calc(100% - 68px - 56px);
  max-height: calc(100% - 68px - 56px);
  */

  grid-column: 1;
  grid-row: 1;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr;
  will-change: transform;
}

#navigation-container {
  position: absolute;
  width: 100% !important;
  z-index: 4;
  height: calc(100% - 68px);
  max-height: calc(100% - 68px);
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
  will-change: transform;
  max-height: 100%;
  overflow: auto;
  grid-column: 1;
  grid-row: 3;
}

#transition-container {
  position: absolute;
  width: 100%;
  height: 100%;
  border-left: 1px solid #aaa;
  will-change: transform;
}

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
  transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-in-enter {
  transform: translateX(100vw);
}
.slide-in-leave-to {
  transform: translateX(-100vw);
}
.slide-in-leave {
  transform: translateX(0);
}
.slide-in-enter-to {
  transform: translateX(0);
}

.slide-out-enter-active,
.slide-out-leave-active {
  transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-out-enter {
  transform: translateX(-100vw);
}
.slide-out-leave-to {
  transform: translateX(100vw);
}
.slide-out-leave {
  transform: translateX(0);
}
.slide-out-enter-to {
  transform: translateX(0);
}
</style>

<style>
.question-title-chip {
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
