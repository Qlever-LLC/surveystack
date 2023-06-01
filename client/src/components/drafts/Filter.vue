<template>
  <v-card class="filter-bar px-6 py-4">
    Filter by:
    <v-select
      v-model="type"
      :items="types"
      label="Type"
      menu-props="bottom, offsetY"
      item
      multiple
      clearable
      outlined
      hide-details
    >
      <template v-slot:selection="{ item, index }">
        <span v-if="index === 0">{{ item }}</span>
        <span v-else-if="index === 1" class="grey--text text-caption others ml-1">
          (+{{ type.length - 1 }} {{ type.length > 2 ? 'others' : 'other' }})
        </span>
      </template>
    </v-select>
    <v-autocomplete
      v-model="survey"
      :items="surveys"
      label="Survey"
      item-value="_id"
      item-text="name"
      menu-props="bottom, offsetY"
      :search-input.sync="comboboxSearch"
      :loading="isSurveyLoading"
      :disabled="surveys.length === 0"
      multiple
      clearable
      outlined
      hide-details
      @change="handleSurveyChange"
    >
      <template v-slot:selection="{ item, index }">
        <span v-if="index === 0">{{ item.name }}</span>
        <span v-else-if="index === 1" class="grey--text text-caption others ml-1">
          (+{{ survey.length - 1 }} {{ survey.length > 2 ? 'others' : 'other' }})
        </span>
      </template>
    </v-autocomplete>

    <v-checkbox v-model="hideArchived" label="Hide Archived"></v-checkbox>
  </v-card>
</template>

<script>
import { computed, defineComponent, ref } from '@vue/composition-api';
import { SubmissionLoadingActions, SubmissionTypes } from '@/store/modules/submissions.store';

export default defineComponent({
  setup(props, { root }) {
    const isSurveyLoading = computed(() =>
      root.$store.getters['submissions/getLoading'](SubmissionLoadingActions.FETCH_SURVEYS)
    );
    const comboboxSearch = ref('');

    const types = Object.values(SubmissionTypes);
    const type = computed({
      get() {
        return root.$store.getters['submissions/filter'].type;
      },
      set(type) {
        root.$store.dispatch('submissions/setFilter', { type, survey: [] });
        root.$store.dispatch('submissions/fetchSurveys');
      },
    });

    const surveys = computed(() => root.$store.getters['submissions/surveys']);
    const survey = computed({
      get() {
        return root.$store.getters['submissions/filter'].survey;
      },
      set(survey) {
        root.$store.dispatch('submissions/setFilter', { survey });
      },
    });

    const hideArchived = computed({
      get() {
        return root.$store.getters['submissions/filter'].hideArchived;
      },
      set(hideArchived) {
        root.$store.dispatch('submissions/setFilter', { hideArchived });
      },
    });

    const handleSurveyChange = () => {
      comboboxSearch.value = '';
    };

    return {
      isSurveyLoading,
      comboboxSearch,
      types,
      type,
      surveys,
      survey,
      hideArchived,
      handleSurveyChange,
    };
  },
});
</script>

<style lang="scss" scoped>
.filter-bar {
  position: sticky;
  top: 0px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 10;

  & > .v-select {
    flex: 1 1 0%;
  }
}

:deep(.v-select__selections) {
  flex-wrap: nowrap;

  div {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
}
</style>
