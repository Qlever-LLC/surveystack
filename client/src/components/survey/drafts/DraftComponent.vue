<!-- eslint-disable vue/no-deprecated-slot-attribute -->
<template>
  <div class="draft-component-wrapper bg-background rounded" :class="{ builder }" v-if="control" ref="wrapper">
    <!-- confirm submission modal -->
    <app-confirm-submission-dialog
      v-if="showConfirmSubmission"
      v-model="showConfirmSubmission"
      :groupId="submission.meta.group.id"
      :submitAsUser="submission.meta.submitAsUser"
      @submit="submitConfirmed(submission)"
      @set-group="setSubmissionGroup"
      :dateSubmitted="submission.meta.dateSubmitted" />

    <!-- Toolbar with question number and overview button -->
    <app-draft-toolbar
      :groupPath="groupPath"
      :required="control && control.options && control.options.required"
      :anon="control && control.options && control.options.redacted"
      :showOverviewIcon="true"
      :questionNumber="questionNumber"
      :showNavigationControl="!builder"
      :surveyName="!builder ? survey.name : undefined"
      @showOverviewClicked="showOverview = !showOverview">
      <!-- forward all the slots -->
      <template v-for="(_, name) in $slots" v-slot:[name]="{ props }">
        <slot :name="name" :props="props" />
      </template>
    </app-draft-toolbar>

    <!-- Overview -->
    <div v-if="showOverview" class="draft-overview">
      <app-draft-overview
        v-if="showOverview"
        :survey="survey"
        :submission="submission"
        :groupPath="groupPath"
        :overviews="$store.getters['draft/overviews']"
        @goto="goto"
        class="maxw-60 mx-auto" />
    </div>

    <!-- Content with questions -->
    <div class="draft-content" v-else>
      <a-fab-transition>
        <a-btn
          v-show="overflowing"
          color="primary"
          fab
          small
          position="fixed"
          style="bottom: 76px; right: 12px; z-index: 150"
          @click="
            scrollY(500);
            overflowing = false;
          ">
          <a-icon>mdi-arrow-down</a-icon>
        </a-btn>
      </a-fab-transition>
      <app-control class="pb-1" :path="path" :control="control" :forceMobile="forceMobile" :isInBuilder="builder" />
    </div>

    <!-- Footer with next/prev buttons -->
    <app-draft-footer
      class="draft-footer px-0 bg-background"
      :class="{ 'show-submit': showOverview }"
      :showPrev="!$store.getters['draft/atStart'] && !$store.getters['draft/showOverview']"
      :enableNext="!$store.getters['draft/hasRequiredUnanswered'] && $store.getters['draft/enableNext']"
      :enableSubmit="!$store.getters['draft/errors']"
      :showSubmit="showOverview"
      :showNav="true"
      @next="next"
      @prev="prev"
      @submit="submit" />
  </div>
  <div v-else-if="builder" class="d-flex flex-column justify-space-around" style="height: 100%">
    <a-sheet class="mx-1 px-2 py-4" color="white" elevation="1" rounded>
      <div class="text-body-1 my-4 text-center">
        Click on the
        <a-btn fab x-small elevation="4" color="blue-darken-2" style="pointer-events: none; border-radius: 50%">
          <a-icon large>mdi-plus</a-icon>
        </a-btn>
        to add questions to your survey
      </div>
      <div class="text-body-1 my-4 text-center">
        <a-btn small color="primary" class="my-1 mr-1" style="pointer-events: none">
          <a-icon class="mr-1">mdi-content-save</a-icon>
          Save
        </a-btn>
        to create a draft
      </div>
      <div class="text-body-1 my-4 text-center">
        <a-btn small class="my-1 mr-1" color="green" style="pointer-events: none">
          <a-icon class="mr-1">mdi-cloud-upload</a-icon>
          Publish
        </a-btn>
        to allow users to submit to your survey
      </div>
    </a-sheet>
  </div>
  <a-alert v-else border="start" prominent variant="text" type="error">
    <a-row align="center">
      <a-col class="grow">
        This survey has no visible questions. Please check the "Relevance Expression" and "Hidden" settings in the
        editor.
      </a-col>
      <a-col class="shrink" v-if="survey._id">
        <a-btn
          :to="{
            name: 'group-surveys-description',
            params: { surveyId: survey._id },
          }">
          back
        </a-btn>
      </a-col>
    </a-row>
  </a-alert>
</template>

<script>
import appControl from './Control.vue';
import appDraftFooter from '@/components/survey/drafts/DraftFooter.vue';
import appDraftOverview from '@/components/survey/drafts/DraftOverview.vue';
import appDraftToolbar from '@/components/survey/drafts/DraftToolbar.vue';
import appConfirmSubmissionDialog from '@/components/survey/drafts/ConfirmSubmissionDialog.vue';

import { queueAction } from '@/utils/surveyStack';

export default {
  components: {
    appControl,
    appDraftFooter,
    appDraftOverview,
    appDraftToolbar,
    appConfirmSubmissionDialog,
  },
  props: {
    survey: { type: Object },
    submission: { type: Object },
    persist: { type: Boolean },
    builder: { type: Boolean, default: false },
    forceMobile: { type: Boolean, default: false },
  },
  data() {
    return {
      overflowing: false,
    };
  },
  computed: {
    path() {
      return this.$store.getters['draft/path'];
    },
    control() {
      return this.$store.getters['draft/control'];
    },
    groupPath() {
      return this.$store.getters['draft/groupPath'];
    },
    questionNumber() {
      return this.$store.getters['draft/questionNumber'];
    },
    showOverview: {
      get() {
        return this.$store.getters['draft/showOverview'];
      },
      set(v) {
        // this.$store.dispatch('draft/showOverview', v);
        queueAction(this.$store, 'draft/showOverview', v);
      },
    },
    showConfirmSubmission: {
      get() {
        return this.$store.getters['draft/showConfirmSubmission'];
      },
      set(v) {
        this.$store.dispatch('draft/showConfirmSubmission', v);
      },
    },
  },
  watch: {
    path() {
      const vm = this;
      vm.overflowing = false;
      setTimeout(() => {
        const previewDom = document.querySelector('#previewSurvey');
        const el = previewDom || document.body;
        const { clientHeight, scrollHeight } = el;
        if (scrollHeight - 100 > clientHeight) {
          vm.overflowing = true;
        } else {
          vm.overflowing = false;
        }
      }, 500);
    },
    overflowing(val, oldVal) {
      if (val && !oldVal) {
        this.scrollTop();
      }
    },
  },
  methods: {
    scrollTop() {
      const previewDom = document.querySelector('#previewSurvey');
      if (previewDom) {
        previewDom.scrollTo(0, 0);
      } else {
        window.scrollTo(0, 0);
      }
    },
    next() {
      // this.$store.dispatch('draft/next')
      queueAction(this.$store, 'draft/next');
      this.scrollTop();
    },
    prev() {
      // this.$store.dispatch('draft/prev')
      queueAction(this.$store, 'draft/prev');
      this.scrollTop();
    },
    goto(path) {
      this.$store.dispatch('draft/goto', path);
      this.showOverview = false;
    },
    submit() {
      // if group is not yet set, select the group defined by the url path
      if (!this.submission.meta.group.id) {
        const currentGroupId = this.$route.params.id;
        const allGroups = this.$store.getters['memberships/groups'];
        const currentGroup = allGroups.find(({ _id }) => _id === currentGroupId);
        if (currentGroup) {
          this.submission.meta.group.id = currentGroup._id;
          this.submission.meta.group.path = currentGroup.path;
        }
      }

      this.showConfirmSubmission = true;
    },
    async submitConfirmed() {
      this.$emit('submit', {
        payload: this.submission,
      });
    },
    setSubmissionGroup(id) {
      const availableGroups = this.$store.getters['memberships/groups'];
      const found = availableGroups.find((group) => group._id === id);

      const group = { id, path: '' };

      if (found) {
        group.path = found.path;
      } else {
        // TODO: what if no group matches? This can happen during resubmission
        return;
      }

      this.$store.dispatch('draft/setProperty', { path: 'meta.group', value: group });
    },
    isOverflown({ clientWidth, clientHeight, scrollWidth, scrollHeight }) {
      return scrollHeight > clientHeight || scrollWidth > clientWidth;
    },
    scrollY(val) {
      const previewDom = document.querySelector('#previewSurvey');
      if (previewDom) {
        previewDom.scrollBy({ top: val, left: 0, behavior: 'smooth' });
      } else {
        window.scrollBy({ top: val, left: 0, behavior: 'smooth' });
      }
    },
  },
  created() {
    const { survey, submission, persist } = this;
    this.$store.dispatch('draft/init', { survey, submission, persist });
  },
};
</script>

<style scoped lang="scss">
.draft-component-wrapper.builder >>> .draft-footer.show-submit .full {
  position: relative;
}

.draft-component-wrapper.builder >>> .draft-footer.show-submit button.primary::after {
  background-color: gray;
  position: absolute;
  content: "Builder responses not visible in 'Results'.  Check 'archived' to view.";
  white-space: pre-wrap;
  padding: 8px;
  border-radius: 5px;
  text-transform: none;
  font-weight: normal;
  text-align: center;
  letter-spacing: 0;
  top: -65px;
  width: 100%;
  color: white;
  font-size: 14px;
  opacity: 0;
}

.draft-component-wrapper.builder >>> .draft-footer.show-submit button.primary::before {
  position: absolute;
  content: '';
  text-transform: none;
  top: -10px;
  left: 111px;
  opacity: 0;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid gray;
}

.draft-component-wrapper.builder >>> .draft-footer.show-submit button.primary::after,
.draft-component-wrapper.builder >>> .draft-footer.show-submit button.primary::before {
  transition: opacity 0.25s;
}

.draft-component-wrapper.builder >>> .draft-footer.show-submit button.primary:hover::after,
.draft-component-wrapper.builder >>> .draft-footer.show-submit button.primary:hover::before {
  opacity: 1;
}

.draft-component-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 4px !important;
}

.draft-overview {
  flex: 1;
  width: 100% !important;
  display: flex;
  flex-direction: column;
  margin-bottom: 68px;
  background-color: rgb(var(--v-theme-background));
}

.draft-content {
  flex: 1 0 auto;
  padding: 0px 8px;
  width: 100%;
  margin: 0rem auto;
  display: flex;
  flex-direction: column;
  margin-bottom: 68px;
  background-color: rgb(var(--v-theme-background));
}

.draft-footer {
  z-index: 3;
  height: 68px;
  width: 100%;
  position: sticky;
  bottom: 16px;
}

@media (max-width: 1280px) {
  .draft-footer {
    width: calc(100% - 12px);
    bottom: 12px;
  }
}
</style>
