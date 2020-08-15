<template>
  <div
    class="wrapper"
  >
    <div
      class="full fill-height"
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
      class="draft-container"
      v-if="submission && survey"
    >
      <draft-toolbar
        :group="groupPath"
        :required="control && control.options && control.options.required"
        :anon="control && control.options && control.options.redacted"
        :showOverviewIcon="!atEnd"
        :questionNumber="questionNumber"
        v-if="!showOverview && index < positions.length"
        @showOverviewClicked="showOverview = !showOverview"
      />
      <draft-title
        v-if="!showOverview && index < positions.length"
        :breadcrumbs="mbreadcrumbs"
      />
      <transition
        class="transition"
        :name="slide"
      >
        <div
          id="transition-container"
          :key="'container-'+index"
        >
          <div
            class="draft-body mx-auto"
          >
              <component
                v-if="control && !atEnd"
                style="width: 100%"
                class="draft-control d-sm-flex flex-column align-center justify-center px-2"
                :key="'question_'+index"
                :is="componentName"
                :control="control"
                :value="value"
                :index="index"
                :submission="submission"
                :meta="submissionField.meta"
                :resources="survey.resources"
                ref="currentControl"
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
          </div>
        </div>
      </transition>
    </div>

    <v-navigation-drawer
      v-if="survey && showOverview"
      v-model="showOverview"
      clipped
      right
      touchless
      stateless
      class="grey lighten-4 navigation-container"
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
      class="px-4 grey lighten-5"
      id="footer-container"
      :showPrev="!atStart"
      :enableNext="mShowNext && controls.length > 0"
      :showSubmit="atEnd && controls.length > 0"
      :showNav="mShowNav"
      @next="handleNext"
      @prev="handlePrevious"
      @submit="handleNext"
    />

    <error-dialog
      v-model="showApiComposeErrors"
      :errors="apiComposeErrors"
      title="API Compose Errors"
    />

    <confirm-submission-dialog
      v-model="confirmSubmissionIsVisible"
      :group="submission.meta.group.id"
      @submit="() => submit(submission)"
      @set-group="setSubmissionGroup"
      :dateSubmitted="submission.meta.dateSubmitted"
    />
  </div>
</template>

<script>
/* eslint-disable no-continue */

import { isEqual } from 'lodash';
import moment from 'moment';

import draftOverview from '@/components/survey/drafts/DraftOverview.vue';
import draftFooter from '@/components/survey/drafts/DraftFooter.vue';
import draftToolbar from '@/components/survey/drafts/DraftToolbar.vue';
import draftTitle from '@/components/survey/drafts/DraftTitle.vue';
import ConfirmSubmissionDialog from '@/components/survey/drafts/ConfirmSubmissionDialog.vue';

import errorDialog from '@/components/ui/Errors.vue';


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
    errorDialog,
    ConfirmSubmissionDialog,
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
      apiComposeErrors: [],
      showApiComposeErrors: false,
      confirmSubmissionIsVisible: false,
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
    groupPath() {
      if (this.submission.meta && this.submission.meta.group && this.submission.meta.group.path) {
        return this.submission.meta.group.path;
      }
      if (this.survey.meta && this.survey.meta.group && this.survey.meta.group.path) {
        return this.survey.meta.group.path;
      }

      return null;
    },
  },
  methods: {
    eval() { },
    setSubmissionGroup(groupId) {
      const groups = this.$store.getters['memberships/groups'];
      const group = groups.find(g => g._id === groupId);
      console.log('selected group', group);
      let path = '';
      if (group) {
        // eslint-disable-next-line prefer-destructuring
        path = group.path;
      }

      this.$set(this.submission.meta, 'group', {
        id: groupId,
        path,
      });
    },
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
      const modified = moment().toISOString(true);
      this.submission.meta.dateModified = modified;
      console.log('setting value:', v, modified);
      this.submissionField.value = v;
      this.submissionField.meta.dateModified = modified;
      console.log(this.submission.meta.dateModified);
      this.$emit('change', this.submission);
      this.persist();

      // TODO: eagerly evaluate relevance expressions here instead of in handleNext / handlePrevious

      const req = this.control.options.required === true;
      if (req) {
        this.showNext(v !== null);
      }
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

      this.index = this.positions.findIndex(p => isEqual(p, pos));
      this.control = utils.getControl(this.controls, pos);
      this.value = submissionUtils.getSubmissionField(this.submission, this.survey, pos).value;
      this.showOverview = false;

      this.calculateControl();
    },
    blurCustomOntology() {
      if (
        this.control.type === 'ontology'
        && this.control.options.allowCustomSelection
        && this.$refs.currentControl
        && this.$refs.currentControl.$refs.input
        && this.$refs.currentControl.$refs.input.updateTags
      ) {
        this.$refs.currentControl.$refs.input.updateTags();
      }
    },
    async handleNext() {
      this.blurCustomOntology();

      this.slide = 'slide-in';
      this.showNav(true);
      this.showNext(true);
      await this.calculateRelevance();

      try {
        await this.calculateApiCompose();
      } catch (error) {
        // ignore during running
      }


      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (this.atEnd) {
          // eslint-disable-next-lineno-await-in-loop
          try {
            // eslint-disable-next-line no-await-in-loop
            const r = await this.calculateApiCompose();
            const errors = r.filter(result => result.error !== undefined);
            console.log('results with errors', errors);
            if (errors.length > 0) {
              this.apiComposeErrors = errors.map(e => ({
                title: e.control.name,
                body: e.error,
              }));
              this.showApiComposeErrors = true;
              return;
            }
          } catch (error) {
            console.log('error on apiCompose', error);
            // TODO show what's wrong
            return;
          }


          this.confirmSubmissionIsVisible = true;
          // this.submit(this.submission);
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

        this.disableNextIfRequiredAndNotAnswered(field);

        this.value = field.value;


        if (this.control.type === 'group') {
          continue;
        }

        this.calculateControl();
        return;
      }
    },
    async handlePrevious() {
      this.blurCustomOntology();
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
        const field = submissionUtils.getSubmissionField(this.submission, this.survey, this.position);
        this.disableNextIfRequiredAndNotAnswered(field);
        this.value = field.value;

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
    disableNextIfRequiredAndNotAnswered(field) {
      const req = this.control.options.required === true;
      if (req) {
        this.showNext(field.value !== null);
      }
    },
  },

  async created() {
    /** Should this be broken out into method? */
    // console.log('pos', this.position);
    // console.log('survey', this.survey);
    if (!this.position) {
      return;
    }


    this.control = utils.getControl(this.controls, this.position);
    const field = submissionUtils.getSubmissionField(this.submission, this.survey, this.position);
    this.disableNextIfRequiredAndNotAnswered(field);
    this.value = field.value;

    this.setNavbarContent({
      title: `${this.survey.name}${this.submission.meta.dateSubmitted ? '&nbsp;<span class="caption">(submitted)</span>' : ''}`,
      subtitle: `
        <span><span class="question-title-chip">Version ${this.activeVersion}</span></span>
        <span class="ml-2">${this.positions.length} Question${this.positions.length > 1 || this.positions.length < 1 ? 's' : ''}</span>
      `,
    });
  },
  mounted() {
    if (
      (this.submission.meta.dateModified && this.submission.meta.dateCreated
        && this.submission.meta.dateCreated !== this.submission.meta.dateModified)
    ) {
      this.showOverview = true;
    }

    if (this.submission.meta.dateSubmitted) {
      console.log('this submission has been previously submitted!');
      this.showOverview = true;
    }

    console.log('mounted done');
  },
  watch: {
    async showOverview() {
      await this.calculateRelevance();
      if (this.$refs.overview) {
        this.$refs.overview.refresh();
      }
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
.draft-control {
  height: calc(100% - 68px);
  width: 100%;
}

.wrapper {
  /* position: relative; */
  /* max-width: 100%;
  height: 100%;
  width: 100%;
  margin: 0px;
  padding: 0px !important; */
}

#footer-container {
  /* background-color: white; */
  width: 100%;
  border-top: 1px solid #eee;
  height: 68px;
  overflow: hidden;
  position: fixed;
  /* bottom: 0px; */
  top: calc(100% - 68px);
  /* top: 80%; */
  /* top: calc(100vh - 68px); */
  /* top: 0vh; */
  left: 0px;
}

.draft-container {
  /* position: absolute; */
  height: 100%;
  width: 100%;
  margin: 0px;
  padding: 0px !important;
  overflow: auto;
  /* prevents scrollbar from appearing during slide transition */
  /* overflow-x: hidden; */
  bottom: 68px;
  top: 0px;
  left: 0px;
  /*
  height: calc(100% - 68px - 56px);
  max-height: calc(100% - 68px - 56px);
  */
/*
  grid-column: 1;
  grid-row: 1; */

  /* display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr;
   */
  /* will-change: transform; */
}

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

#draft-toolbar {
}

#draft-breadcrumbs {

}

.draft-body {
  will-change: transform;
  max-height: 100%;
  max-width: 50rem;
  width: 100%;
  overflow: auto;

}


#transition-container {
  width: 100%;
  left: 0;
  position: absolute;
  /* border-left: 1px solid #aaa; */
  will-change: transform, opacity;
  /* overflow-x: hidden; */
}

@media (min-width: 768px) {
  #transition-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(100% - 68px - 24px - 104px);
    /* margin-top: 2rem; */

    /* display: flex;
    align-items: center;
    display: -webkit-flex;
    -webkit-align-items: center;
    align-items: center;
    justify-content: center; */
  }
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
  /* background-color: white; */
  /* color: #ff5722; */
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
  transition: 0.2s transform cubic-bezier(0.4, 0, 0.2, 1),
    0.05s opacity cubic-bezier(0.4, 0, 0.2, 1);
  /* transition: 1s cubic-bezier(0.4, 0, 0.2, 1); */
}

.slide-in-enter {
  transform: translateX(100vw);
  opacity: 0;
}
.slide-in-leave-to {
  transform: translateX(-100vw);
  opacity: 0;
}
.slide-in-leave {
  transform: translateX(0);
  opacity: 1;
}
.slide-in-enter-to {
  transform: translateX(0);
  opacity: 1;
}

.slide-out-enter-active,
.slide-out-leave-active {
  transition: 0.2s transform cubic-bezier(0.4, 0, 0.2, 1),
    0.05s opacity cubic-bezier(0.4, 0, 0.2, 1);
  /* transition: 1s cubic-bezier(0.4, 0, 0.2, 1); */
}

.slide-out-enter {
  transform: translateX(-100vw);
  opacity: 0;
}
.slide-out-leave-to {
  transform: translateX(100vw);
  opacity: 0;
}
.slide-out-leave {
  transform: translateX(0);
  opacity: 1;
}
.slide-out-enter-to {
  transform: translateX(0);
  opacity: 1;
}
</style>

<style>
.question-title-chip {
  display: inline-flex;
  /* background-color: white; */
  /* color: #ff5722; */
  border-radius: 0.4rem;
  font-weight: bold;
  font-size: 80%;
  padding: 0.2rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
  border: 1px solid black;
}
</style>
