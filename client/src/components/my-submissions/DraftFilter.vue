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

    <v-btn-toggle v-model="draftTypes" dense multiple mandatory>
      <v-btn> Local </v-btn>
      <v-btn> Server </v-btn>
    </v-btn-toggle>
  </v-card>
</template>

<script>
import { computed, defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  setup(props, { root }) {
    const surveySearchInput = ref('');
    const isFetchingSurveys = computed(() => root.$store.getters['myDrafts/isFetchingSurveys']);
    const surveys = computed(() => root.$store.getters['myDrafts/surveys']);
    const survey = computed({
      get() {
        return root.$store.getters['myDrafts/filter'].surveyIds;
      },
      set(surveyIds) {
        root.$store.dispatch('myDrafts/setFilter', { surveyIds });
      },
    });

    const draftTypes = computed({
      get() {
        return root.$store.getters['myDrafts/filterType'];
      },
      set(val) {
        root.$store.dispatch('myDrafts/setFilter', {
          surveyIds: [],
          local: val.includes(0),
          remote: val.includes(1),
        });
        root.$store.dispatch('myDrafts/fetchSurveys');
      },
    });

    return {
      isFetchingSurveys,
      surveySearchInput,
      surveys,
      survey,
      draftTypes,
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
