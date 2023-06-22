<template>
  <div :class="{ 'mb-16': showFooter }">
    <submission-filter class="mb-6"></submission-filter>

    <div v-if="isLoading && submissions.length === 0" class="d-flex justify-center my-8">
      <v-progress-circular color="primary" indeterminate></v-progress-circular>
    </div>
    <p v-else-if="submissions.length === 0" class="my-8 text-center">No matching submissions found.</p>
    <template v-else>
      <submission-card
        v-for="submission in submissions"
        :key="submission._id"
        :submission="submission"
        :surveys="surveys"
        :selected="isSelected(submission._id)"
        @change-select="handleSelect(submission, $event)"
      ></submission-card>
      <v-pagination v-model="page" :length="totalPage" class="mt-4"></v-pagination>
    </template>

    <submission-footer></submission-footer>
  </div>
</template>

<script>
import { computed, defineComponent } from '@vue/composition-api';
import SubmissionCard from '@/components/my-submissions/Card.vue';
import SubmissionFilter from '@/components/my-submissions/SubmissionFilter.vue';
import SubmissionFooter from '@/components/my-submissions/SubmissionFooter.vue';

export default defineComponent({
  components: {
    SubmissionCard,
    SubmissionFilter,
    SubmissionFooter,
  },
  setup(props, { root }) {
    const showFooter = computed(() => root.$store.getters['mySubmissions/selected'].length > 0);
    const isLoading = computed(() => root.$store.getters['mySubmissions/isLoading']);
    const submissions = computed(() => root.$store.getters['mySubmissions/submissions']);
    const surveys = computed(() => root.$store.getters['mySubmissions/surveys']);
    const totalPage = computed(() => root.$store.getters['mySubmissions/totalPage']);
    const page = computed({
      get() {
        return root.$store.getters['mySubmissions/page'];
      },
      set(val) {
        root.$store.dispatch('mySubmissions/setPage', val);
      },
    });

    const isSelected = root.$store.getters['mySubmissions/isSelected'];
    const handleSelect = (submission, selected) => {
      if (selected) {
        root.$store.dispatch('mySubmissions/selectSubmission', submission);
      } else {
        root.$store.dispatch('mySubmissions/deselectSubmission', submission);
      }
    };

    return {
      showFooter,
      isLoading,
      submissions,
      surveys,
      page,
      totalPage,
      isSelected,
      handleSelect,
    };
  },
});
</script>
