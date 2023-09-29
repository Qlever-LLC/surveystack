<template>
  <div :class="{ 'mb-16': showFooter }">
    <div v-if="isLoading && submissionsAndDrafts.length === 0" class="d-flex justify-center my-8">
      <v-progress-circular color="primary" indeterminate></v-progress-circular>
    </div>
    <p v-else-if="submissionsAndDrafts.length === 0" class="my-8 text-center">No matching submissions found.</p>
    <template v-else>
      <submission-card
        v-for="submission in submissionsAndDrafts"
        :key="submission._id"
        :submission="submission"
        :draft="isDraft(submission._id)"
        :local="isLocal(submission._id)"
        :surveys="surveys"
        :selected="isSelected(submission._id)"
        @change-select="handleSelect(submission, $event)"
      />
      <v-pagination v-model="page" :length="totalPage" class="mt-4"></v-pagination>
    </template>

    <submission-footer></submission-footer>
  </div>
</template>

<script>
import { computed, defineComponent } from '@vue/composition-api';
import SubmissionCard from '@/components/my-submissions/Card.vue';
import SubmissionFooter from '@/components/my-submissions/SubmissionFooter.vue';
import DraftCard from '@/components/my-submissions/Card.vue';

export default defineComponent({
  components: {
    DraftCard,
    SubmissionCard,
    SubmissionFooter,
  },
  setup(props, { root }) {
    const showFooter = computed(() => root.$store.getters['submissions/selected'].length > 0);
    const isLoading = computed(() => root.$store.getters['submissions/isLoading']);
    const surveys = computed(() => root.$store.getters['submissions/surveys']);
    const submissionsAndDrafts = computed(() => root.$store.getters['submissions/submissionsAndDrafts']);
    const totalPage = computed(() => root.$store.getters['submissions/totalPage']);
    const page = computed({
      get() {
        return root.$store.getters['submissions/page'];
      },
      set(val) {
        root.$store.dispatch('submissions/setPage', val);
      },
    });
    const isDraft = root.$store.getters['submissions/isDraft'];
    const isLocal = root.$store.getters['submissions/isLocal'];
    const isSelected = root.$store.getters['submissions/isSelected'];
    const handleSelect = (submission, selected) => {
      if (selected) {
        root.$store.dispatch('submissions/selectSubmission', submission);
      } else {
        root.$store.dispatch('submissions/deselectSubmission', submission);
      }
    };

    return {
      showFooter,
      isLoading,
      surveys,
      submissionsAndDrafts,
      page,
      totalPage,
      isDraft,
      isLocal,
      isSelected,
      handleSelect,
    };
  },
});
</script>
