<template>
  <div :class="{ 'mb-16': showFooter }">
    <draft-filter></draft-filter>

    <div v-if="isLoading && drafts.length === 0" class="d-flex justify-center my-8">
      <v-progress-circular color="primary" indeterminate></v-progress-circular>
    </div>
    <p v-else-if="drafts.length === 0" class="my-8 text-center">No matching submissions found.</p>
    <template v-else>
      <draft-card
        v-for="draft in drafts"
        :key="draft._id"
        :submission="draft"
        :surveys="surveys"
        :local="isLocal(draft._id)"
        draft
        :selected="isSelected(draft._id)"
        @change-select="handleSelect(draft, $event)"
      ></draft-card>
      <v-pagination v-model="page" :length="totalPage" class="mt-4"></v-pagination>
    </template>

    <draft-footer></draft-footer>
  </div>
</template>

<script>
import { computed, defineComponent } from '@vue/composition-api';
import DraftCard from '@/components/my-submissions/Card.vue';
import DraftFooter from '@/components/my-submissions/DraftFooter.vue';
import DraftFilter from '@/components/my-submissions/DraftFilter.vue';

export default defineComponent({
  components: {
    DraftCard,
    DraftFilter,
    DraftFooter,
  },
  setup(props, { root }) {
    const showFooter = computed(() => root.$store.getters['myDrafts/selected'].length > 0);
    const isLoading = computed(() => root.$store.getters['myDrafts/isLoading']);
    const drafts = computed(() => root.$store.getters['myDrafts/drafts']);
    const surveys = computed(() => root.$store.getters['myDrafts/surveys']);
    const totalPage = computed(() => root.$store.getters['myDrafts/totalPage']);
    const page = computed({
      get() {
        return root.$store.getters['myDrafts/page'];
      },
      set(val) {
        root.$store.dispatch('myDrafts/setPage', val);
      },
    });
    const isLocal = root.$store.getters['myDrafts/isLocal'];
    const isSelected = root.$store.getters['myDrafts/isSelected'];
    const handleSelect = (draft, selected) => {
      if (selected) {
        root.$store.dispatch('myDrafts/selectDraft', draft);
      } else {
        root.$store.dispatch('myDrafts/deselectDraft', draft);
      }
    };

    return {
      showFooter,
      isLoading,
      drafts,
      surveys,
      page,
      totalPage,
      isLocal,
      isSelected,
      handleSelect,
    };
  },
});
</script>
