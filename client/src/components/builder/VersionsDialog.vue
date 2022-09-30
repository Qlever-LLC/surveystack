<template>
  <v-dialog :value="value" @input="(v) => $emit('input', v)" width="500" max-width="75%">
    <v-card>
      <v-card-title>Survey Versions</v-card-title>
      <v-card-text>
        <v-skeleton-loader type="list-item@3" v-if="cleanupInfoIsLoading" />
        <p v-else-if="cleanupInfoHasError">An error occurred loading survey cleanup data</p>
        <div v-else-if="cleanupInfoHasLoaded && !cleanupInfoHasError">
          <v-checkbox
            v-model="selectedVersionsToDelete"
            :label="getVersionLabel(revision.version)"
            :value="String(revision.version)"
            :disabled="deleteVersionIsDisabled(revision.version)"
            :append-icon="shouldDeleteVersion(revision.version) ? 'mdi-alert' : null"
            v-for="revision in survey.revisions"
            :key="revision.version"
            class="mt-0"
          />
          <p>
            Versions to be deleted:&nbsp;
            <span v-if="selectedVersionsToDelete.length > 0">
              {{ selectedVersionsToDelete.join(', ') }}
            </span>
            <span v-else> none </span>
          </p>
        </div>
        <!-- <v-btn @click="() => fetchCleanupInfo()">fetch data</v-btn> -->
        <v-btn
          @click="deleteVersions"
          :disabled="deleteVersionsIsLoading || selectedVersionsToDelete.length === 0"
          :loading="deleteVersionsIsLoading"
        >
          Delete selected versions
        </v-btn>
        <v-alert v-if="deleteVersionsHasError" type="error"> An error occurred deleting survey versions. </v-alert>
        <v-alert v-else-if="deleteVersionsHasLoaded && deleteVersionsResponse" type="success">
          Successfully deleted survey versions {{ deleteVersionsResponse.deletedVersions.join(', ') }}
        </v-alert>
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
import get from 'lodash/get';

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

    async function fetchCleanupInfo() {
      cleanupInfoIsLoading.value = true;
      cleanupInfoHasError.value = false;
      cleanupInfoHasLoaded.value = false;
      cleanupInfoResponse.value = { ...initialCleanupInfo };
      try {
        const { data } = await api.get(`/surveys/cleanup/${props.survey._id}`);
        cleanupInfoResponse.value = data;
        selectedVersionsToDelete.value = [...cleanupInfoResponse.value.versionsToDelete];
      } catch {
        cleanupInfoHasError.value = true;
      } finally {
        cleanupInfoHasLoaded.value = true;
        cleanupInfoIsLoading.value = false;
      }
    }

    fetchCleanupInfo();

    async function fetchLibraryConsumers() {
      const { data } = await api.get(`/surveys/list-library-consumers?id=${props.survey._id}`);
      console.log(data);
      // TODO: for each consumer, for each revision, recursively traverse controls and find
      // practically the list consumers endpoint only checks the first three levels of controls, see surveyController.js around line 420
    }
    if (props.survey.meta.isLibrary) {
      fetchLibraryConsumers();
    }

    async function deleteVersions() {
      try {
        deleteVersionsIsLoading.value = true;
        deleteVersionsHasError.value = false;
        deleteVersionsHasLoaded.value = false;
        deleteVersionsResponse.value = { ...initialDeleteVersions };

        const queryParams = new URLSearchParams();
        selectedVersionsToDelete.value.forEach((v) => queryParams.append('versions[]', v));
        // queryParams.append('dryRun', true);
        const { data } = await api.post(`/surveys/cleanup/${props.survey._id}?${queryParams}`);
        deleteVersionsResponse.value = data;
      } catch {
        deleteVersionsHasError.value = true;
      } finally {
        deleteVersionsHasLoaded.value = true;
        deleteVersionsIsLoading.value = false;
      }
      fetchCleanupInfo();
      emit('reloadSurvey');
    }

    function getCount(version) {
      return get(cleanupInfoResponse.value.surveySubmissionsVersionCounts, version, 0);
    }

    const isPlural = (x) => x === 0 || x > 1;

    return {
      cleanupInfoIsLoading,
      cleanupInfoHasLoaded,
      cleanupInfoHasError,
      cleanupInfoResponse,
      fetchCleanupInfo,
      getCount,
      getVersionLabel(version) {
        const count = getCount(version);
        return `${version}: ${count} submission${isPlural(count) ? 's' : ''}`;
      },
      deleteVersionIsDisabled(version) {
        return cleanupInfoResponse.value.versionsToKeep.includes(String(version));
      },
      shouldDeleteVersion(version) {
        return cleanupInfoResponse.value.versionsToDelete.includes(String(version));
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
