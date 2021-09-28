<template>
  <div class="draft-component-wrapper draft wrapper" :class="{ builder: builder }" v-if="control" ref="wrapper">
    <!-- confirm submission modal -->
    <app-confirm-submission-dialog
      v-model="showConfirmSubmission"
      :groupId="submission.meta.group.id"
      @submit="() => submitConfirmed(submission)"
      @set-group="setSubmissionGroup"
      :dateSubmitted="submission.meta.dateSubmitted"
    />

    <!-- Toolbar with question number and overview button -->
    <app-draft-toolbar
      :group="groupPath"
      :required="control && control.options && control.options.required"
      :anon="control && control.options && control.options.redacted"
      :showOverviewIcon="true"
      :questionNumber="$store.getters['draft/questionNumber']"
      @showOverviewClicked="showOverview = !showOverview"
    />

    <!-- Overview -->
    <div v-if="showOverview" class="draft-overview">
      <app-draft-overview
        v-if="showOverview"
        :survey="survey"
        :submission="submission"
        :groupPath="groupPath"
        :overviews="$store.getters['draft/overviews']"
        @goto="goto"
        class="maxw-60 mx-auto"
      />
    </div>

    <!-- Content with questions -->
    <div class="draft-content" v-else>
      <v-fab-transition>
        <v-btn
          v-show="overflowing"
          color="primary"
          fab
          dark
          small
          fixed
          style="bottom: 76px; right: 12px; z-index: 150"
          @click="
            scrollY(500);
            overflowing = false;
          "
        >
          <v-icon>mdi-arrow-down</v-icon>
        </v-btn>
      </v-fab-transition>
      <app-control class="my-auto maxw-60 mx-auto" :path="path" :control="control" />
    </div>

    <!-- Footer with next/prev buttons -->
    <app-draft-footer
      class="draft-footer px-0 grey lighten-4"
      :class="{ 'show-submit': showOverview }"
      :style="{
        left: moveFooter ? '256px' : '0px',
        width: moveFooter ? 'calc(100% - 256px)' : '100%',
      }"
      :showPrev="!$store.getters['draft/atStart'] && !$store.getters['draft/showOverview']"
      :enableNext="!$store.getters['draft/hasRequiredUnanswered']"
      :enableSubmit="!$store.getters['draft/errors']"
      :showSubmit="showOverview"
      :showNav="true"
      @next="next"
      @prev="prev"
      @submit="submit"
    />
  </div>
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
    builder: { type: Boolean },
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
    moveFooter() {
      if (this.builder) {
        return false;
      }
      // we want a fixed footer, but this causes issues when the menu side bar is shown...
      // Basically, we need to move the footer to the left and calculate its width if the menu is shown,
      // However, if display breakpoint is 'md' or less, we do not move the footer
      return this.$store.getters['appui/menu'] && !this.$vuetify.breakpoint.mdAndDown;
    },
  },
  watch: {
    path() {
      const vm = this;
      vm.overflowing = false;
      setTimeout(() => {
        const body = document.getElementsByTagName('body')[0];
        const { clientHeight, scrollHeight } = body;
        if (scrollHeight - 100 > clientHeight) {
          vm.overflowing = true;
        } else {
          vm.overflowing = false;
        }
      }, 500);
    },
  },
  methods: {
    next() {
      // this.$store.dispatch('draft/next')
      queueAction(this.$store, 'draft/next');
      window.scrollTo(0, 0);
    },
    prev() {
      // this.$store.dispatch('draft/prev')
      queueAction(this.$store, 'draft/prev');
      window.scrollTo(0, 0);
    },
    goto(path) {
      this.$store.dispatch('draft/goto', path);
      this.showOverview = false;
    },
    submit() {
      // propose group settings
      if (this.submission.meta.group.id) {
        // if groupName is already set on the submission draft, return this
      } else {
        // if group is not yet set, select the user's selected group if set
        const activeGroup = this.$store.getters['memberships/activeGroup'];
        if (activeGroup) {
          this.submission.meta.group.id = activeGroup._id;
          this.submission.meta.group.path = activeGroup.path;
        } else {
          //user has not group selected, or is not logged in
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
      window.scrollBy({ top: val, left: 0, behavior: 'smooth' });
    },
  },
  created() {
    const { survey, submission, persist } = this;
    this.$store.dispatch('draft/init', { survey, submission, persist });
  },
  mounted() {
    // console.log('wrapper', this.$refs.wrapper.clientHeight, this.$refs.wrapper.scrollHeight);
  },
};
</script>

<style scoped>
.draft-component-wrapper.builder >>> .draft-footer.show-submit .full {
  position: relative;
}

.draft-component-wrapper.builder >>> .draft-footer.show-submit button.primary::after {
  background-color: gray;
  position: absolute;
  content: "Builder submissions not visible in 'Results'.  Check 'archived' to view.";
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
  overflow: auto;
  display: flex;
  flex-direction: column;
  padding: 0px !important;
}

.draft-overview {
  flex: 1;
  width: 100% !important;
  display: flex;
  flex-direction: column;
  margin-bottom: 68px;
  background-color: var(--v-background-base);
}

.draft-content {
  flex: 1 0 auto;
  padding: 0px 8px;
  width: 100%;
  margin: 0rem auto;
  display: flex;
  flex-direction: column;
  margin-bottom: 68px;
  background-color: var(--v-background-base);
}

.draft-footer {
  z-index: 3;
  height: 68px;
  width: 100%;
  position: fixed;
  bottom: 0px;
  left: 0px;
}
</style>
