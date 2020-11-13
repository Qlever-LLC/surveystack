<template>
  <v-container class="draft-component-wrapper">

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

    <!-- Navigation drawer with overview -->
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
        :survey="survey"
        :submission="submission"
        :groupPath="groupPath"
        :overviews="$store.getters['draft/overviews']"
        @goto="goto"
      />
    </v-navigation-drawer>

    <!-- Content with questions -->
    <div class="mt-6 draft-content">
      <app-control
        :path="path"
        :control="control"
      />
    </div>

    <!-- Footer with next/prev buttons -->
    <app-draft-footer
      class="px-4 grey lighten-5 footer-container"
      :showPrev="!$store.getters['draft/atStart'] && !$store.getters['draft/showOverview']"
      :enableNext="!(control.options.required && $store.getters['draft/property'](`${path}.value`) === null)"
      :enableSubmit="!$store.getters['draft/errors']"
      :showSubmit="showOverview"
      :showNav="true"
      @next="$store.dispatch('draft/next')"
      @prev="$store.dispatch('draft/prev')"
      @submit="showConfirmSubmission = true"
    />

  </v-container>
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
        // eslint-disable-next-line prefer-destructuring
        console.log('found selected group', found);
        group.path = found.path;
      }

      this.$store.dispatch('draft/setProperty', { path: 'meta.group', value: group });
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
}

.draft-component-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-top: 0px;
}

.draft-content {
  flex: 1;
  overflow: auto;
}

.footer-container {
  z-index: 1;
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
</style>
