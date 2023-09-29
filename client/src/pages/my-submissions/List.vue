<template>
  <div class="wrapper">
    <v-container>
      <my-submissions-filter />
      <submissions-list />
    </v-container>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import SubmissionsList from './SubmissionsList.vue';
import MySubmissionsFilter from '@/components/my-submissions/Filter.vue';

export default defineComponent({
  components: {
    MySubmissionsFilter,
    SubmissionsList,
  },
  setup(props, { root }) {
    //TDOO set page title - when setting the title /subtitle like this, it shows up on other page. either set volatile somehow, or set it in the other pages manually too
    /*root.$store.dispatch('appui/setTitle', 'My Submissions');
    root.$store.dispatch('appui/setSubtitle', 'Drafts and submitted surveys');*/

    //load data
    loadData();

    async function loadData() {
      await root.$store.dispatch('submissions/fetchDrafts');
      await root.$store.dispatch('submissions/fetchDraftSurveys'); //TODO needs to be called after fetchDrafts - better integrate fetchSurveys in to fetchDrafts
      await root.$store.dispatch('submissions/fetchSubmissions');
      await root.$store.dispatch('submissions/fetchSubmissionSurveys'); //needs to be called after fetchSubmissions - better integrate fetchSurveys in to fetchSubmissions
    }
    return {};
  },
});
</script>

<style lang="scss" scoped>
.wrapper {
  background-color: var(--v-background-base);
  width: 100%;
  height: 100%;
}
/*.wrapper {
  min-height: 100%;

  .header {
    border-radius: 0px;
  }

  .container {
    position: relative;
    max-width: 1280px;
  }
}*/

.space-x-4 > * + * {
  margin-left: 16px;
}
</style>
