<template>
  <v-dialog :value="value" @input="(v) => $emit('input', v)" width="500" max-width="75%" scrollable>
    <v-card>
      <v-card-title>Survey Versions</v-card-title>
      <v-card-text style="max-height: 500px">
        <v-skeleton-loader type="list-item@3" v-if="cleanupInfoIsLoading" />
        <p v-else-if="cleanupInfoHasError">An error occurred loading survey cleanup data</p>
        <div v-else-if="cleanupInfoHasLoaded && !cleanupInfoHasError">
          <div v-for="revision in survey.revisions" :key="revision.version" class="row py-0">
            <div class="col-10 mt-1 py-0">
              <v-chip
                dark
                small
                :color="isVersionDeletable(revision.version) ? 'grey' : 'green'"
                :title="isVersionDeletable(revision.version) ? 'unused' : 'in use'"
              >
                {{ revision.version }}</v-chip
              >
              <span class="ml-2"
                >{{ getSubmissionCount(revision.version) || 'no' }} submission{{
                  getSubmissionCount(revision.version) > 1 ? 's' : ''
                }}
              </span>
              <span v-if="survey.meta.isLibrary" class="ml-2"
                >{{ getQSConsumerCount(revision.version) || 'no' }} survey{{
                  getQSConsumerCount(revision.version) > 1 ? 's' : ''
                }}
              </span>
            </div>
            <div class="col-1 py-0">
              <v-icon
                @click="toggleCompare(revision.version)"
                class="mt-1"
                title="Compare version"
                :color="compareRevisions.includes(revision.version) ? 'primary' : ''"
                >mdi-compare-horizontal</v-icon
              >
            </div>
            <div class="col-1 py-0" v-if="isVersionDeletable(revision.version)">
              <v-checkbox
                v-model="selectedVersionsToDelete"
                :value="String(revision.version)"
                :disabled="!isVersionDeletable(revision.version)"
                hide-details
                title="Delete version"
                class="mt-0"
                color="red"
              />
            </div>
          </div>

          <p v-if="false">
            Versions to be deleted:&nbsp;
            <span v-if="selectedVersionsToDelete.length > 0">
              {{ selectedVersionsToDelete.join(', ') }}
            </span>
            <span v-else> none </span>
          </p>
        </div>
        <v-alert v-if="deleteVersionsHasError" type="error" class="mt-1" dismissible>
          An error occurred deleting survey versions.
        </v-alert>
        <v-alert v-else-if="deleteVersionsHasLoaded && deleteVersionsResponse" type="success" class="mt-1" dismissible>
          Successfully deleted survey version {{ deleteVersionsResponse.deletedVersions.join(', ') }}
        </v-alert>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="compareRevisions.length > 0"
          :disabled="compareRevisions.length === 1"
          @click="surveyDiffDialogVisible = true"
          color="primary"
          outlined
        >
          Compare {{ compareRevisions[0] }}
          {{ compareRevisions.length === 2 ? 'with ' + compareRevisions[1] : '' }}
        </v-btn>
        <v-btn
          @click="deleteVersions"
          :disabled="deleteVersionsIsLoading || selectedVersionsToDelete.length === 0"
          :loading="deleteVersionsIsLoading"
          color="error"
          outlined
        >
          Delete {{ selectedVersionsToDelete.length }} versions
        </v-btn>
        <v-btn @click="$emit('cancel')" color="primary" text> Close </v-btn>
      </v-card-actions>
    </v-card>
    <survey-diff-dialog
      v-if="surveyDiffDialogVisible"
      :value="surveyDiffDialogVisible"
      :revision-a="survey.revisions.find((r) => r.version === compareRevisions[0])"
      :revision-b="survey.revisions.find((r) => r.version === compareRevisions[1])"
      @cancel="surveyDiffDialogVisible = false"
    />
  </v-dialog>
</template>

<script>
import { ref } from '@vue/composition-api';
import api from '@/services/api.service';
import get from 'lodash/get';
import SurveyDiffDialog from '@/components/survey/SurveyDiffDialog';

export default {
  components: { SurveyDiffDialog },
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
  setup(props, { emit }) {
    const initialCleanupInfo = {
      versionsToKeep: [],
      versionsToDelete: [],
      surveyVersions: props.survey.revisions.map(({ version }) => String(version)),
      surveySubmissionsVersionCounts: {},
    };

    const initialDeleteVersions = {
      deletedVersions: [],
      keptVersions: [],
    };

    const cleanupInfoIsLoading = ref(false);
    const cleanupInfoHasLoaded = ref(false);
    const cleanupInfoHasError = ref(false);
    const cleanupInfoResponse = ref({ ...initialCleanupInfo });

    const deleteVersionsIsLoading = ref(false);
    const deleteVersionsHasLoaded = ref(false);
    const deleteVersionsHasError = ref(false);
    const deleteVersionsResponse = ref({ ...initialDeleteVersions });

    const selectedVersionsToDelete = ref([]);

    const libraryConsumers = ref({});

    const compareRevisions = ref([]);
    const surveyDiffDialogVisible = ref(false);

    fetchCleanupInfo();

    async function fetchCleanupInfo() {
      cleanupInfoIsLoading.value = true;
      cleanupInfoHasError.value = false;
      cleanupInfoHasLoaded.value = false;
      cleanupInfoResponse.value = { ...initialCleanupInfo };
      try {
        const { data: submissionUsageInfo } = await api.get(`/surveys/cleanup/${props.survey._id}`);
        cleanupInfoResponse.value = submissionUsageInfo;
        selectedVersionsToDelete.value = [...cleanupInfoResponse.value.versionsToDelete];
        libraryConsumers.value = cleanupInfoResponse.value.libraryConsumersByVersion;
      } catch {
        cleanupInfoHasError.value = true;
      } finally {
        cleanupInfoHasLoaded.value = true;
        cleanupInfoIsLoading.value = false;
      }
    }

    async function deleteVersions() {
      try {
        deleteVersionsIsLoading.value = true;
        deleteVersionsHasError.value = false;
        deleteVersionsHasLoaded.value = false;
        deleteVersionsResponse.value = { ...initialDeleteVersions };

        const queryParams = new URLSearchParams();
        selectedVersionsToDelete.value.forEach((v) => queryParams.append('versions[]', v));
        const { data } = await api.post(`/surveys/cleanup/${props.survey._id}?${queryParams}`);
        deleteVersionsResponse.value = data;
      } catch {
        deleteVersionsHasError.value = true;
      } finally {
        deleteVersionsHasLoaded.value = true;
        deleteVersionsIsLoading.value = false;
        compareRevisions.value = []; //clear compare selections as they may contain a deleted revision
      }
      await fetchCleanupInfo();
      emit('reload-survey');
    }

    function getSubmissionCount(version) {
      return get(cleanupInfoResponse.value.surveySubmissionsVersionCounts, version, 0);
    }

    function getQSConsumerCount(version) {
      return libraryConsumers.value[version] || 0;
    }

    function toggleCompare(revision) {
      let foundIdx = compareRevisions.value.indexOf(revision);
      if (foundIdx > -1) {
        compareRevisions.value.splice(foundIdx, 1);
      } else {
        compareRevisions.value.push(revision);
        compareRevisions.value.sort();
      }
    }

    return {
      cleanupInfoIsLoading,
      cleanupInfoHasLoaded,
      cleanupInfoHasError,
      cleanupInfoResponse,
      libraryConsumers,
      compareRevisions,
      surveyDiffDialogVisible,
      toggleCompare,
      getSubmissionCount,
      getQSConsumerCount,
      isVersionDeletable(version) {
        return (
          cleanupInfoResponse.value.versionsToDelete.includes(String(version)) && getQSConsumerCount(version) === 0
        );
      },
      selectedVersionsToDelete,
      deleteVersionsIsLoading,
      deleteVersionsHasLoaded,
      deleteVersionsHasError,
      deleteVersionsResponse,
      deleteVersions,
    };
  },
};
</script>

<style></style>
