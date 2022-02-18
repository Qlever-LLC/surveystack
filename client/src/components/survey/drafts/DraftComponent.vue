<template>
  <div class="outer-wrapper" :class="{ builder: builder }">
    <div class="gutter"></div>
    <div
      class="draft-component-wrapper draft wrapper d-flex flex-column"
      v-if="control"
      ref="wrapper"
      :class="{ 'force-mobile': forceMobile }"
    >
      <!-- confirm submission modal -->
      <app-confirm-submission-dialog
        v-if="showConfirmSubmission"
        v-model="showConfirmSubmission"
        :groupId="submission.meta.group.id"
        @submit="() => submitConfirmed(submission)"
        @set-group="setSubmissionGroup"
        :dateSubmitted="submission.meta.dateSubmitted"
      />

      <!-- Toolbar with question number and overview button -->
      <app-draft-toolbar
        :groupPath="groupPath"
        :required="control && control.options && control.options.required"
        :anon="control && control.options && control.options.redacted"
        :showOverviewIcon="true"
        :questionNumber="$store.getters['draft/questionNumber']"
        @showOverviewClicked="showOverview = !showOverview"
        :overviewIsVisible="showOverview"
        v-if="builder"
        class="flex-grow-0"
        :class="{ 'pr-3': builder }"
      >
        <!-- forward all the slots -->
        <slot v-for="(_, name) in $slots" :name="name" :slot="name" />
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
          class="maxw-60 mr-auto"
        />
      </div>

      <!-- Content with questions -->
      <div class="draft-content flex-grow-1 justify-space-between" v-else>
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
        <app-control
          class="maxw-60 mr-auto"
          :path="path"
          :control="control"
          :forceMobile="forceMobile"
          :isInBuilder="builder"
        />
      </div>

      <app-draft-footer
        class="draft-footer px-6 py-2"
        :class="{
          'show-submit': showOverview,
          'draft-footer-builder': builder,
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
    <div v-else-if="builder" class="d-flex flex-column justify-space-around" style="height: 100%">
      <v-sheet class="mx-1 px-2 py-4" color="white" elevation="1" rounded
        ><div class="text-body-1 my-4 text-center">
          Click on the
          <v-btn fab dark x-small color="blue darken-2" style="pointer-events:none">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
          to add questions to your survey
        </div>
        <div class="text-body-1 my-4 text-center">
          <v-btn dark small color="primary" class="my-1 mr-1" style="pointer-events:none">
            <v-icon class="mr-1">mdi-content-save</v-icon>
            Save
          </v-btn>
          to create a draft
        </div>
        <div class="text-body-1 my-4 text-center">
          <v-btn dark small class="my-1 mr-1" color="green" style="pointer-events:none">
            <v-icon class="mr-1">mdi-cloud-upload</v-icon>
            Publish
          </v-btn>
          to allow users to submit to your survey
        </div></v-sheet
      >
    </div>
    <v-alert v-else border="left" prominent text type="error">
      <v-row align="center">
        <v-col class="grow">
          This survey has no visible questions. Please check the "Relevance Expression" and "Hidden" settings in the
          editor.
        </v-col>
        <v-col class="shrink">
          <v-btn :to="`/surveys/${survey._id}`">back</v-btn>
        </v-col>
      </v-row>
    </v-alert>
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
      // if group is not yet set, select the user's selected group if set
      if (!this.submission.meta.group.id) {
        const activeGroupId = this.$store.getters['memberships/activeGroup'];
        if (activeGroupId) {
          const allGroups = this.$store.getters['memberships/groups'];
          const activeGroup = allGroups.find(({ _id }) => _id === activeGroupId);
          if (activeGroup) {
            this.submission.meta.group.id = activeGroup._id;
            this.submission.meta.group.path = activeGroup.path;
          }
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
.outer-wrapper {
  height: 100%;
}

.gutter {
}

.show-mobile-image.outer-wrapper {
  display: grid;
  grid-template: 300px 1fr / 1fr;
}

.show-mobile-image .gutter {
  width: 100%;
  height: 100%;
  background-color: #ccc;
}

.builder .draft-component-wrapper >>> .draft-footer.show-submit .full {
  position: relative;
}

.draft-footer-builder {
  min-height: 68px;
}

.builder .draft-component-wrapper >>> .draft-footer.show-submit button.primary::after {
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
.builder .draft-component-wrapper >>> .draft-footer.show-submit button.primary::before {
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

.builder .draft-component-wrapper >>> .draft-footer.show-submit button.primary::after,
.builder .draft-component-wrapper >>> .draft-footer.show-submit button.primary::before {
  transition: opacity 0.25s;
}

.builder .draft-component-wrapper >>> .draft-footer.show-submit button.primary:hover::after,
.builder .draft-component-wrapper >>> .draft-footer.show-submit button.primary:hover::before {
  opacity: 1;
}

.draft-component-wrapper {
  height: calc(100vh - 68px - 48px);
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
  background-color: var(--v-background-base);
}

.draft-content {
  flex: 1 0 auto;
  padding: 0px 8px;
  width: 100%;
  margin: 0rem auto;
  display: flex;
  flex-direction: column;
  /* background-color: var(--v-background-base); */
  background-color: white;
}

.draft-footer {
  z-index: 3;
  height: 52px;
  width: 100%;
  position: fixed;
  bottom: 0px;
  left: 0px;
  background-color: var(--v-appbar-base);
  box-shadow: 0px 2px 4px -1px rgb(0 0 0 / 20%), 0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%);
}

@media screen and (min-width: 1200px) {
  .outer-wrapper {
    background-color: #bbb;
    display: grid;
    grid-template: 1fr / 1fr 500px;
    width: 100%;
  }

  .gutter {
    height: 100%;
    background-color: #bbb;
    width: 500px;
    order: 2;
  }

  .draft-footer {
    width: calc(100% - 500px);
  }

  .draft-component-wrapper {
  }

  .builder .gutter {
  }

  .builder .draft-component-wrapper {
    /* min-width: 384px; 399px +/- 15px for scrollbar */
    /* min-width: 384px; */
    min-width: 400px;
    width: 100%;
    max-width: 1200px;
  }

  .builder-draft.builder {
    /* hack to avoid horizontal scrolling for builder mobile view, since media queries are for whole viewport and draft is embedded */
    overflow-x: hidden;
  }
}

.force-mobile > .draft-footer {
  width: 100%;
}

.force-mobile .gutter {
  /* width: 0; */
  display: none;
}

.draft-component-wrapper.force-mobile {
  height: calc(667px - 48px);
  /* always show vertical scrollbar so that builder preview is constant width */
  /* overflow-y: scroll; */
}
</style>
