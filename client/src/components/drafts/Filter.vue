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
      @change="onChange"
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
import { SubmissionTypes } from '@/store/modules/submissions.store';

export default defineComponent({
  setup(props, { root }) {
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
    const isSurveyLoading = computed(() => root.$store.getters['submissions/getLoading']('surveys'));
    const surveys = computed(() => root.$store.getters['submissions/surveys']);
    const survey = computed({
      get() {
        return root.$store.getters['submissions/filter'].survey;
      },
      set(survey) {
        root.$store.dispatch('submissions/setFilter', { survey });
      },
    });
    const comboboxSearch = ref('');
    const onChange = () => {
      comboboxSearch.value = '';
    };

    return {
      isSurveyLoading,
      types,
      type,
      surveys,
      survey,
      comboboxSearch,
      onChange,
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

  & > .v-input {
    flex: 1 1 0% !important;
    flex-shrink: 0;
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
