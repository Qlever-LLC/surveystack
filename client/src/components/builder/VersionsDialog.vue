<template>
  <v-dialog :value="value" @input="(v) => $emit('input', v)" width="500" max-width="75%">
    <v-card>
      <v-card-title>Survey Versions</v-card-title>
      <v-card-text>
        <v-skeleton-loader type="list-item@3" v-if="cleanupInfoIsLoading" />
        <p v-else-if="cleanupInfoHasError">An error occurred loading survey cleanup data</p>
        <div v-else-if="cleanupInfoHasLoaded && !cleanupInfoHasError">
          <div v-for="revision in survey.revisions" :key="revision.version" class="row py-0">
            <div class="col-10 mt-1 py-0">
              <v-chip
                dark
                small
                :color="deleteVersionIsDisabled(revision.version) ? 'green' : 'grey'"
                :title="deleteVersionIsDisabled(revision.version) ? 'in use' : 'unused'"
              >
                {{ revision.version }}</v-chip
              >
              <span class="ml-2"
                >{{ getCount(revision.version) || 'no' }} submission{{
                  getCount(revision.version) > 1 ? 's' : ''
                }}</span
              >
            </div>
            <div class="col-2 py-0">
              <v-checkbox
                v-model="selectedVersionsToDelete"
                label="delete"
                :value="String(revision.version)"
                :disabled="deleteVersionIsDisabled(revision.version)"
                hide-details
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
        <!-- <v-btn @click="() => fetchCleanupInfo()">fetch data</v-btn> -->

        <v-alert v-if="deleteVersionsHasError" type="error"> An error occurred deleting survey versions. </v-alert>
        <v-alert v-else-if="deleteVersionsHasLoaded && deleteVersionsResponse" type="success">
          Successfully deleted survey versions {{ deleteVersionsResponse.deletedVersions.join(', ') }}
        </v-alert>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer />
        <v-btn
          @click="deleteVersions"
          :disabled="deleteVersionsIsLoading || selectedVersionsToDelete.length === 0"
          :loading="deleteVersionsIsLoading"
          color="error"
          outlined
        >
          Delete selected versions
        </v-btn>
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

    return {
      cleanupInfoIsLoading,
      cleanupInfoHasLoaded,
      cleanupInfoHasError,
      cleanupInfoResponse,
      fetchCleanupInfo,
      getCount,
      deleteVersionIsDisabled(version) {
        return cleanupInfoResponse.value.versionsToKeep.includes(String(version));
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
