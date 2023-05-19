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
    ></v-select>
    <v-select
      v-model="survey"
      :items="surveys"
      label="Survey"
      item-value="_id"
      item-text="name"
      menu-props="bottom, offsetY"
      :loading="isLoading"
      :disabled="surveys.length === 0"
      multiple
      clearable
      outlined
      hide-details
    >
      <template v-slot:selection="{ item, index }">
        <span v-if="index === 0">{{ item.name }}</span>
        <span v-else-if="index === 1" class="grey--text text-caption ml-1">
          (+{{ survey.length - 1 }} {{ survey.length > 2 ? 'others' : 'other' }})
        </span>
      </template>
    </v-select>
  </v-card>
</template>

<script>
import { computed, defineComponent } from '@vue/composition-api';
import { SubmissionTypes } from '@/store/modules/submissions.store';

export default defineComponent({
  setup(props, { root }) {
    const isLoading = computed(() => root.$store.getters['submissions/isFetching']);
    const types = Object.values(SubmissionTypes);
    const type = computed({
      get() {
        root.$store.getters['submissions/filter'].type;
      },
      set(type) {
        root.$store.dispatch('submissions/setFilter', { type });
      },
    });
    const surveys = computed(() => root.$store.getters['submissions/surveys']);
    const survey = computed({
      get() {
        root.$store.getters['submissions/filter'].survey;
      },
      set(survey) {
        root.$store.dispatch('submissions/setFilter', { survey });
      },
    });

    return {
      isLoading,
      types,
      type,
      surveys,
      survey,
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

  .v-select {
    flex: 1 1 0% !important;
    flex-shrink: 0;
  }
}
</style>
}
