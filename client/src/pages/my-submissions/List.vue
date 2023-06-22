<template>
  <div class="wrapper background flex flex-column">
    <v-card class="d-flex align-center px-6 space-x-4">
      <v-tabs v-model="tab" :height="72">
        <v-tab>
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-file-document-edit</v-icon>
            My Drafts
          </div>
        </v-tab>
        <v-tab>
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-email-check</v-icon>
            My Submissions
          </div>
        </v-tab>
      </v-tabs>
    </v-card>

    <v-container class="flex-grow-1">
      <v-tabs-items v-model="tab" class="background mt-4">
        <v-tab-item>
          <drafts-list></drafts-list>
        </v-tab-item>
        <v-tab-item>
          <submissions-list></submissions-list>
        </v-tab-item>
      </v-tabs-items>
    </v-container>
  </div>
</template>

<script>
import { computed, defineComponent, watch } from '@vue/composition-api';
import DraftsList from './DraftsList.vue';
import SubmissionsList from './SubmissionsList.vue';

export default defineComponent({
  components: {
    DraftsList,
    SubmissionsList,
  },
  setup(props, { root }) {
    const tab = computed({
      get() {
        return root.$store.getters['mySubmissions/isDraftTab'] ? 0 : 1;
      },
      set(val) {
        root.$store.dispatch('mySubmissions/setIsDraftTab', val === 0);
      },
    });

    watch(tab, (val, val1) => {
      // skip first loading - means previous tab is `undefined`
      if (typeof val1 === 'undefined') {
        return;
      }

      if (val === 0) {
        root.$store.dispatch('myDrafts/fetchDrafts');
        root.$store.dispatch('myDrafts/fetchSurveys');
      } else {
        root.$store.dispatch('mySubmissions/fetchSubmissions');
        root.$store.dispatch('mySubmissions/fetchSurveys');
      }
    });

    return {
      tab,
    };
  },
});
</script>

<style lang="scss" scoped>
.wrapper {
  min-height: 100%;

  .header {
    border-radius: 0px;
  }

  .container {
    position: relative;
    max-width: 1280px;

    .search-bar .survey-select {
      min-width: 300px;
    }
  }
}

.space-x-4 > * + * {
  margin-left: 16px;
}
</style>
