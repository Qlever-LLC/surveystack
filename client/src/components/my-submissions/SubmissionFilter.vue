<template>
  <v-card class="search-bar d-flex align-center px-6 py-4">
    <v-autocomplete
      v-model="survey"
      class="survey-select flex-grow-0"
      label="Survey"
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

    <v-btn-toggle v-model="submissionTypes" dense multiple mandatory>
      <v-btn> Creator </v-btn>
      <v-btn> Proxy </v-btn>
      <v-btn> Resubmitter </v-btn>
    </v-btn-toggle>

    <v-checkbox v-model="hideArchived" label="Hide Archived" class="mt-0 flex-shrink-0" hide-details></v-checkbox>
  </v-card>
</template>

<script>
import { computed, defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  setup(props, { root }) {
    const surveySearchInput = ref('');
    const isFetchingSurveys = computed(() => root.$store.getters['mySubmissions/isFetchingSurveys']);
    const surveys = computed(() => root.$store.getters['mySubmissions/surveys']);
    const survey = computed({
      get() {
        return root.$store.getters['mySubmissions/filter'].surveyIds;
      },
      set(surveyIds) {
        root.$store.dispatch('mySubmissions/setFilter', { surveyIds });
      },
    });

    const hideArchived = computed({
      get() {
        return root.$store.getters['mySubmissions/filter'].hideArchived;
      },
      set(hideArchived) {
        root.$store.dispatch('mySubmissions/setFilter', { hideArchived, surveyIds: [] });
        root.$store.dispatch('mySubmissions/fetchSurveys');
      },
    });

    const submissionTypes = computed({
      get() {
        return root.$store.getters['mySubmissions/filterType'];
      },
      set(val) {
        root.$store.dispatch('mySubmissions/setFilter', {
          surveyIds: [],
          creator: val.includes(0),
          proxyUserId: val.includes(1),
          resubmitter: val.includes(2),
        });
        root.$store.dispatch('mySubmissions/fetchSurveys');
      },
    });

    return {
      isFetchingSurveys,
      surveySearchInput,
      surveys,
      survey,
      hideArchived,
      submissionTypes,
    };
  },
});
</script>

<style lang="scss" scoped>
.search-bar {
  & > * + * {
    margin-left: 16px;
  }

  .survey-select {
    min-width: 300px;
  }
}
</style>
