<template>
  <a-dialog :value="value" @input="(v) => $emit('input', v)" width="500" max-width="75%" scrollable>
    <a-card>
      <a-card-title>Survey Versions</a-card-title>
      <a-card-text cssMaxHeight500px>
        <a-skeleton-loader type="list-item@3" v-if="cleanupInfoIsLoading" />
        <p v-else-if="cleanupInfoHasError">An error occurred loading survey cleanup data</p>
        <div v-else-if="cleanupInfoHasLoaded && !cleanupInfoHasError">
          <div v-for="revision in survey.revisions" :key="revision.version" class="row py-0">
            <div class="col-10 mt-1 py-0">
              <a-chip
                dark
                small
                :color="isVersionDeletable(revision.version) ? 'grey' : 'green'"
                :title="isVersionDeletable(revision.version) ? 'unused' : 'in use'"
              >
                Version
                {{
                  revision.version +
                  (revision.version > survey.latestVersion
                    ? ' (draft)'
                    : revision.version === survey.latestVersion
                    ? ' (published) '
                    : '')
                }}
              </a-chip>
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
              <a-icon
                @click="toggleCompare(revision.version)"
                class="mt-1"
                title="Compare version"
                :color="compareRevisions.includes(revision.version) ? 'primary' : ''"
                >mdi-compare-horizontal</a-icon
              >
            </div>
            <div class="col-1 py-0" v-if="isVersionDeletable(revision.version)">
              <a-checkbox
                v-model="selectedVersionsToDelete"
                :selected-item="String(revision.version)"
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
        <a-alert v-if="deleteVersionsHasError" type="error" class="mt-1" closable>
          An error occurred deleting survey versions.
        </a-alert>
        <a-alert v-else-if="deleteVersionsHasLoaded && deleteVersionsResponse" type="success" class="mt-1" closable>
          Successfully deleted survey version {{ deleteVersionsResponse.deletedVersions.join(', ') }}
        </a-alert>
      </a-card-text>
      <a-divider />
      <a-card-actions>
        <a-spacer />
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
      </a-card-actions>
    </a-card>
    <survey-diff-dialog
      v-if="surveyDiffDialogVisible"
      :value="surveyDiffDialogVisible"
      :revision-a="survey.revisions.find((r) => r.version === compareRevisions[0])"
      :revision-b="survey.revisions.find((r) => r.version === compareRevisions[1])"
      @cancel="surveyDiffDialogVisible = false"
    />
  </a-dialog>
</template>

<script>
import { ref } from '@vue/composition-api';
import api from '@/services/api.service';
import get from 'lodash/get';
import SurveyDiffDialog from '@/components/survey/SurveyDiffDialog';

export default {
  components: {
    SurveyDiffDialog,
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    surveyId: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const survey = ref({});
    const cleanupInfoIsLoading = ref(false);
    const cleanupInfoHasLoaded = ref(false);
    const cleanupInfoHasError = ref(false);
    const cleanupInfoResponse = ref({});

    const deleteVersionsIsLoading = ref(false);
    const deleteVersionsHasLoaded = ref(false);
    const deleteVersionsHasError = ref(false);
    const deleteVersionsResponse = ref({ deletedVersions: [], keptVersions: [] });

    const selectedVersionsToDelete = ref([]);

    const libraryConsumers = ref({});

    const compareRevisions = ref([]);
    const surveyDiffDialogVisible = ref(false);

    fetchData();

    async function fetchData() {
      //fetch survey with all revisions
      const { data } = await api.get(`/surveys/${props.surveyId}?version=all`);
      survey.value = data;

      //fetch cleanup info
      cleanupInfoIsLoading.value = true;
      cleanupInfoHasError.value = false;
      cleanupInfoHasLoaded.value = false;
      cleanupInfoResponse.value = {
        versionsToKeep: [],
        versionsToDelete: [],
        surveyVersions: survey.value.revisions.map(({ version }) => String(version)),
        surveySubmissionsVersionCounts: {},
      };
      try {
        const { data: submissionUsageInfo } = await api.get(`/surveys/cleanup/${props.surveyId}`);
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
        deleteVersionsResponse.value = { deletedVersions: [], keptVersions: [] };

        const queryParams = new URLSearchParams();
        selectedVersionsToDelete.value.forEach((v) => queryParams.append('versions[]', v));
        const { data } = await api.post(`/surveys/cleanup/${props.surveyId}?${queryParams}`);
        deleteVersionsResponse.value = data;
      } catch {
        deleteVersionsHasError.value = true;
      } finally {
        deleteVersionsHasLoaded.value = true;
        deleteVersionsIsLoading.value = false;
        compareRevisions.value = []; //clear compare selections as they may contain a deleted revision
      }
      await fetchData();
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
      survey,
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
        return !cleanupInfoResponse.value.versionsToKeep.includes(String(version)); //Hint: checking against versionsToKeep instead of versionsToDelete as drafts may not be included in versionsToDelete
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
