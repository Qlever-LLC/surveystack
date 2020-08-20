/* eslint-disable no-continue */

import {
  isEqual,
} from 'lodash';
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

import { isIos } from '@/utils/compatibility';

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
      let {
        type,
      } = this.control;
      type = type.charAt(0).toUpperCase() + type.slice(1);
      return `appControl${type}`;
    },
    controls() {
      // TODO: handle version not found
      return this.survey.revisions.find(revision => revision.version === this.activeVersion)
        .controls;
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
    isIos() {
      return isIos();
    },
    eval() {},
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
    setStatus({
      type,
      message,
    }) {
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
        const field = submissionUtils.getSubmissionField(this.submission, this.survey, this
          .position);

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
        const field = submissionUtils.getSubmissionField(this.submission, this.survey, this
          .position);
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
      this.control.value = sandbox({
        data: this.submission.data,
      });
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
      this.$emit('persist', {
        submission: this.submission,
      });
    },
    async submit(payload) {
      this.$emit('submit', {
        payload,
      });
    },
    async calculateRelevance() {
      return codeEvaluator.calculateRelevance(this.survey, this.submission, this.positions, this
        .controls);
    },
    async calculateApiCompose() {
      console.log('calculating api compose');
      return codeEvaluator.calculateApiCompose(this.survey, this.submission, this.positions, this
        .controls);
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
