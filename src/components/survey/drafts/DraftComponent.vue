<template>
  <div
    class="draft-component-wrapper"
    v-if="control"
    ref="wrapper"
  >

    <!-- confirm submission modal -->
    <app-confirm-submission-dialog
      v-model="showConfirmSubmission"
      :group="submission.meta.group.id"
      @submit="() => submit(submission)"
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
    <div
      v-if="showOverview"
      class="grey lighten-4 draft-overview"
    >
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
    <div
      class="draft-content"
      v-else
    >
      <v-fab-transition>
        <v-btn
          v-show="overflowing"
          color="pink"
          fab
          dark
          small
          fixed
          style="bottom: 76px; right: 12px; z-index: 150"
          @click="scrollY(500); overflowing = false"
        >
          <v-icon>mdi-arrow-down</v-icon>
        </v-btn>
      </v-fab-transition>
      <app-control
        class="my-auto maxw-60 mx-auto"
        :path="path"
        :control="control"
      />
    </div>

    <!-- Footer with next/prev buttons -->
    <app-draft-footer
      class="draft-footer px-0 grey lighten-4"
      :style="{left: moveFooter ? '256px' : '0px', width: moveFooter ? 'calc(100% - 256px)' : '100%'}"
      :showPrev="!$store.getters['draft/atStart'] && !$store.getters['draft/showOverview']"
      :enableNext="!$store.getters['draft/hasRequiredUnanswered']"
      :enableSubmit="!$store.getters['draft/errors']"
      :showSubmit="showOverview"
      :showNav="true"
      @next="$store.dispatch('draft/next')"
      @prev="$store.dispatch('draft/prev')"
      @submit="showConfirmSubmission = true"
    />

  </div>
</template>

<script>
import appControl from './Control.vue';
import appDraftFooter from '@/components/survey/drafts/DraftFooter.vue';
import appDraftOverview from '@/components/survey/drafts/DraftOverview.vue';
import appDraftToolbar from '@/components/survey/drafts/DraftToolbar.vue';
import appConfirmSubmissionDialog from '@/components/survey/drafts/ConfirmSubmissionDialog.vue';


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
        this.$store.dispatch('draft/showOverview', v);
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
    goto(path) {
      this.$store.dispatch('draft/goto', path);
      this.showOverview = false;
    },
    async submit() {
      this.$emit('submit', {
        payload: this.submission,
      });
    },
    setSubmissionGroup(id) {
      const availableGroups = this.$store.getters['memberships/groups'];
      const found = availableGroups.find(group => group._id === id);

      const group = { id, path: '' };

      if (found) {
        group.path = found.path;
      }

      this.$store.dispatch('draft/setProperty', { path: 'meta.group', value: group });
    },
    isOverflown({
      clientWidth, clientHeight, scrollWidth, scrollHeight,
    }) {
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
}

.draft-content {
  flex: 1 0 auto;
  padding: 0px 8px;
  width: 100%;
  margin: 0rem auto;
  display: flex;
  flex-direction: column;
  margin-bottom: 68px;
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
