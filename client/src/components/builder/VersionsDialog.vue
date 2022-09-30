<template>
  <v-dialog :value="value" @input="(v) => $emit('input', v)" width="500" max-width="75%">
    <v-card>
      <v-card-title>Survey Versions</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item v-for="revision in survey.revisions" :key="revision.version">
            <span class="mr-1">{{ revision.version }}:&nbsp;</span>
            <span v-if="submissionsDataIsLoading"> Loading submissions </span>
            <span v-else-if="submissionsDataHasLoaded && !submissionsDataHasError">
              {{ getCount(revision.version) }} submission{{
                getCount(revision.version) > 1 || getCount(revision.version) === 0 ? 's' : ''
              }}
              <span v-if="getCount(revision.version) === 0"><v-icon small>mdi-alert</v-icon></span>
            </span>
            <span v-else-if="submissionsDataHasError"> Error loading submissions data </span>
          </v-list-item>
          <p>Versions to be deleted: {{ versionsToDelete.join(', ') }}</p>
        </v-list>
        <v-btn @click="() => fetchSubmissionsData()">fetch data</v-btn>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="$emit('cancel')" color="primary" text> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, computed } from '@vue/composition-api';
import api from '@/services/api.service';
import { fetchSubmissions } from '../survey/question_types/Ontology.vue';
import countBy from 'lodash/countBy';
import get from 'lodash/get';
import difference from 'lodash/difference';

const getSurveyVersion = (submission) => submission.meta.survey.version;

export default {
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    survey: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const submissionsDataIsLoading = ref(false);
    const submissionsDataHasLoaded = ref(false);
    const submissionsDataHasError = ref(false);
    const submissionsData = ref([]);
    const submissionsVersionCounts = ref({});
    const submissionsVersionCountsWithZeros = ref({});
    // const versionsToDelete = computed(() => Object.entries(submissionsVersionCountsWithZeros.value).filter(([_, v]) => v === 0).map(([k, _]) => k)
    // );
    const surveyVersions = props.survey.revisions.map(({ version }) => String(version));
    const versionsToDelete = computed(() => difference(surveyVersions, submissionsVersionCounts));

    async function fetchLibraryConsumers() {
      const { data } = await api.get(`/surveys/list-library-consumers?id=${props.survey._id}`);
      console.log(data);
      // TODO: for each consumer, for each revision, recursively traverse controls and find
      // practically the list consumers endpoint only checks the first three levels of controls, see surveyController.js around line 420
    }
    if (props.survey.meta.isLibrary) {
      fetchLibraryConsumers();
    }

    async function fetchSubmissionsData() {
      // TODO: Fix bug where empty submissions to be deleted shows wrong value

      submissionsDataIsLoading.value = true;
      submissionsDataHasError.value = false;
      submissionsDataHasLoaded.value = false;
      submissionsVersionCounts.value = {};
      // submissionsVersionCountsWithZeros.value = {};
      const queryParams = new URLSearchParams();
      queryParams.append('project', '{"meta.survey.version":1}');
      queryParams.append('survey', props.survey._id);
      try {
        const { data } = await api.get(`/submissions?${queryParams}`);
        submissionsData.value = data;
        submissionsVersionCounts.value = countBy(data.map(getSurveyVersion));
        // submissionsVersionCountsWithZeros.value = surveyVersions.reduce((counts, version) => {
        //   // console.log(version, get(submissionsVersionCounts.value, version, 0));
        //   // console.log(counts);
        //   return {
        //     ...counts,
        //     [version]: get(submissionsVersionCounts.value, version, 0),
        //   };
        // }, {});
      } catch {
        submissionsDataHasError.value = true;
      } finally {
        submissionsDataHasLoaded.value = true;
        submissionsDataIsLoading.value = false;
      }
    }

    async function deleteVersions() {}

    fetchSubmissionsData();

    return {
      submissionsDataIsLoading,
      submissionsDataHasLoaded,
      submissionsDataHasError,
      submissionsData,
      fetchSubmissionsData,
      submissionsVersionCounts,
      submissionsVersionCountsWithZeros,
      getCount(version) {
        return get(submissionsVersionCounts.value, version, 0);
        // return submissionsVersionCountsWithZeros.value[version];
      },
      versionsToDelete,
    };
  },
};
</script>

<style></style>
