<template>
  <div class="background wrapper">
    <v-container>
      <v-card class="filter-bar px-6 py-4">
        Filter by:
        <v-select
          v-model="filter.status"
          :items="statusItems"
          label="Status"
          menu-props="bottom, offsetY"
          item
          multiple
          clearable
          outlined
          hide-details
        ></v-select>
        <v-select
          v-model="filter.source"
          :items="sourceItems"
          label="Source"
          menu-props="bottom, offsetY"
          :disabled="filter.status.length > 0 && !filter.status.includes('draft')"
          multiple
          clearable
          outlined
          hide-details
        ></v-select>
        <v-select
          v-model="filter.survey"
          :items="surveys"
          label="Survey"
          item-value="_id"
          item-text="name"
          menu-props="bottom, offsetY"
          :loading="isLoading.survey"
          :disabled="surveys.length === 0"
          multiple
          clearable
          outlined
          hide-details
        >
          <template v-slot:selection="{ item, index }">
            <span v-if="index === 0">{{ item.name }}</span>
            <span v-else-if="index === 1" class="grey--text text-caption ml-1">
              (+{{ filter.survey.length - 1 }} {{ filter.survey.length > 2 ? 'others' : 'other' }})
            </span>
          </template>
        </v-select>
      </v-card>

      <v-progress-circular
        v-if="isLoading.data && pageData.length === 0"
        :size="30"
        color="primary"
        class="loading"
        indeterminate
      ></v-progress-circular>

      <div v-else class="mt-8">
        <draft-card v-for="submission in pageData" :key="submission._id" :submission="submission"> </draft-card>
        <v-pagination v-model="page" :length="pages" :total-visible="8" class="mt-8"></v-pagination>
      </div>

      <v-snackbar v-model="isError" :timeout="4000">
        {{ error }}
        <v-btn color="grey" text @click="isError = false">Close</v-btn>
      </v-snackbar>
    </v-container>
  </div>
</template>

<script>
import { computed, defineComponent, reactive, ref, watch } from '@vue/composition-api';
import DraftCard from '@/components/drafts/Card.vue';
import api from '@/services/api.service';

export default defineComponent({
  components: { DraftCard },
  setup(props, { root }) {
    const statusItems = [
      { value: 'draft', text: 'Draft' },
      { value: 'submitted', text: 'Submitted' },
    ];

    const sourceItems = [
      { value: 'server', text: 'Server' },
      { value: 'local', text: 'Local' },
    ];

    const isLoading = reactive({
      data: false,
      survey: false,
    });
    const isError = ref(false);
    const error = ref('');
    const page = ref(1);
    const perPage = ref(10);
    const localDrafts = ref([]);
    const data = ref([]);
    const filter = ref({
      status: [],
      source: [],
      survey: [],
    });
    const surveys = ref([]);

    const isDraft = computed(() => filter.value.status.length === 0 || filter.value.status.includes('draft'));
    const isSubmitted = computed(() => filter.value.status.length === 0 || filter.value.status.includes('submitted'));
    const isLocal = computed(() => filter.value.source.length === 0 || filter.value.source.includes('local'));
    const pages = computed(() => Math.max(1, Math.ceil(data.value.length / perPage.value)));
    const pageData = computed(() => data.value.slice((page.value - 1) * perPage.value, page.value * perPage.value));
    const filteredLocalDrafts = computed(() =>
      !isDraft.value || !isLocal.value
        ? []
        : filter.value.survey.length === 0
        ? localDrafts.value
        : localDrafts.value.filter((submission) => filter.value.survey.includes(submission.meta.survey.id))
    );

    const uniqueArray = (source, key = '') => {
      if (key) {
        return source.filter((item, index, ary) => ary.findIndex((i) => i[key] === item[key]) === index);
      }

      return source.filter((item, index, ary) => ary.indexOf(item) === index);
    };

    const sortByModifiedDate = (a, b) =>
      new Date(b.meta.dateModified).valueOf() - new Date(a.meta.dateModified).valueOf();

    const showError = (message) => {
      error.value = message;
      isError.value = true;
    };

    const init = async () => {
      // Fetch local drafts, order by modified date desc
      const localSubmissions = await root.$store.dispatch('submissions/fetchLocalSubmissions');
      localDrafts.value = localSubmissions
        .map((submission) => ({ ...submission, local: true }))
        .sort(sortByModifiedDate);

      fetchSurveys();
    };

    // Fetch surveys
    const fetchSurveys = async () => {
      filter.value.survey = [];
      isLoading.survey = true;

      const params = new URLSearchParams();
      if (isDraft.value) {
        params.append('draft', '1');

        if (isLocal.value) {
          const surveyIds = uniqueArray(localDrafts.value.map((draft) => draft.meta.survey.id));
          surveyIds.forEach((id) => params.append('local[]', id));
        }
      }
      if (isSubmitted.value) {
        params.append('submitted', '1');
      }

      const { data } = await api.get(`/drafts/surveys?${params}`);
      surveys.value = data;

      isLoading.survey = false;
    };

    // Fetch remote drafts and submitted submissions
    const fetchData = async () => {
      isLoading.data = true;

      try {
        const params = new URLSearchParams();
        if (isDraft.value) {
          params.append('draft', '1');
        }
        if (isSubmitted.value) {
          params.append('submitted', '1');
        }
        filter.value.survey.forEach((id) => params.append('survey[]', id));

        const {
          data: { submitted, draft },
        } = await api.get(`/drafts?${params}`);

        const items = [...filteredLocalDrafts.value];
        if (isDraft.value) {
          items.push(...draft.content);
        }
        if (isSubmitted.value) {
          items.push(...submitted.content);
        }
        data.value = uniqueArray(items, '_id').sort(sortByModifiedDate);
      } catch (e) {
        showError(e);
      }

      isLoading.data = false;
    };

    init();

    watch(
      filter,
      (val, val1) => {
        page.value = 1;
        fetchData();
      },
      { deep: true }
    );

    watch(
      () => [filter.value.status, filter.value.source],
      () => {
        fetchSurveys();
      }
    );

    return {
      statusItems,
      sourceItems,
      surveys,
      filter,
      isLoading,
      isError,
      error,
      page,
      pages,
      pageData,
    };
  },
});
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  .container {
    position: relative;
    flex: 1 1 0%;

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

    .loading {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -100%);
    }
  }
}
</style>
