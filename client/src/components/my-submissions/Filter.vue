<template>
  <v-card class="search-bar d-flex flex-column flex-md-row align-md-center px-6 py-4">
    <v-autocomplete
      v-model="draftTypes"
      class="survey-select flex-grow-0"
      label="Draft States"
      :items="draftStates"
      item-value="value"
      item-text="label"
      menu-props="bottom, offsetY"
      :search-input.sync="stateSearchInput"
      multiple
      clearable
      dense
      outlined
      hide-details
      @change="stateSearchInput = ''"
    />
    <v-autocomplete
      v-model="submissionTypes"
      class="survey-select flex-grow-0"
      label="Submitted States"
      :items="submittedStates"
      item-value="value"
      item-text="label"
      menu-props="bottom, offsetY"
      :search-input.sync="stateSearchInput"
      multiple
      clearable
      dense
      outlined
      hide-details
      @change="stateSearchInput = ''"
    />
    <v-autocomplete
      v-model="survey"
      class="survey-select flex-grow-0"
      label="Surveys"
      :items="surveys"
      item-value="_id"
      item-text="name"
      menu-props="bottom, offsetY"
      :search-input.sync="surveySearchInput"
      multiple
      clearable
      dense
      outlined
      hide-details
      :loading="isFetchingSurveys"
      :disabled="surveys.length === 0"
      @change="surveySearchInput = ''"
    >
      <template v-slot:selection="{ item, index }">
        <span v-if="index === 0">{{ item.name }}</span>
        <span v-else-if="index === 1" class="grey--text text-caption others ml-1">
          (+{{ survey.length - 1 }} {{ survey.length > 2 ? 'others' : 'other' }})
        </span>
      </template>
    </v-autocomplete>
  </v-card>
</template>

<script>
import { computed, defineComponent, ref } from '@vue/composition-api';

const draftStates = [
  { value: 'draft', label: 'Draft' },
  { value: 'readyToSubmit', label: 'Ready to submit' },
];
const submittedStates = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'resubmitted', label: 'Resubmitted' },
  { value: 'proxied', label: 'Proxied' },
  { value: 'archived', label: 'Archived' },
];

export default defineComponent({
  setup(props, { root }) {
    const surveySearchInput = ref('');
    const stateSearchInput = ref('');
    const isFetchingSurveys = computed(() => root.$store.getters['mySubmissions/isFetchingSurveys']);
    const surveys = computed(() => root.$store.getters['mySubmissions/surveys']);
    const survey = computed({
      get() {
        //TODO track survey filters here instead of twice in both stores
        return root.$store.getters['mySubmissions/filter'].surveyIds;
        //return root.$store.getters['myDrafts/filter'].surveyIds;
      },
      set(surveyIds) {
        root.$store.dispatch('mySubmissions/setFilter', { surveyIds });
        root.$store.dispatch('myDrafts/setFilter', { surveyIds });
      },
    });

    const draftTypes = computed({
      get() {
        return root.$store.getters['myDrafts/filterType'];
      },
      set(val) {
        root.$store.dispatch('myDrafts/setFilter', {
          draft: val.some((v) => v === 'draft'),
          readyToSubmit: val.some((v) => v === 'readyToSubmit'),
        });
        root.$store.dispatch('myDrafts/fetchSurveys');
      },
    });

    const submissionTypes = computed({
      get() {
        return root.$store.getters['mySubmissions/filterType'];
      },
      set(val) {
        root.$store.dispatch('mySubmissions/setFilter', {
          submitted: val.some((v) => v === 'submitted'),
          resubmitted: val.some((v) => v === 'resubmitted'),
          proxied: val.some((v) => v === 'proxied'),
          archived: val.some((v) => v === 'archived'),
        });
        root.$store.dispatch('mySubmissions/fetchSurveys');
      },
    });

    return {
      isFetchingSurveys,
      stateSearchInput,
      surveySearchInput,
      surveys,
      survey,
      draftStates,
      draftTypes,
      submittedStates,
      submissionTypes,
    };
  },
});
</script>

<style lang="scss" scoped>
.search-bar {
  column-gap: 16px;
  row-gap: 12px;

  .survey-select {
    min-width: 350px;
  }
}

@media (max-width: 960px) {
  .search-bar .survey-select {
    min-width: 0px;
  }
}
</style>
