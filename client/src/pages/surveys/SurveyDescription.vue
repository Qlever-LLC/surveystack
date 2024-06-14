<template>
  <a-dialog
    v-if="state.loading && props.modelValue"
    :modelValue="props.modelValue"
    @update:modelValue="closeDialog"
    @click:outside="closeDialog"
    style="height: 75vh; width: 75vw">
    <span class="d-flex justify-center">
      <a-progress-circular :size="50" />
    </span>
  </a-dialog>
  <a-dialog
    v-else-if="state.survey"
    :modelValue="props.modelValue"
    @update:modelValue="closeDialog"
    @click:outside="closeDialog"
    :max-width="mobile ? '100%' : '75%'"
    scrollable>
    <a-card class="my-2">
      <a-card-title class="mt-4 d-flex align-start justify-space-between" style="white-space: pre-wrap">
        <span class="d-flex align-start"><a-icon class="mr-2">mdi-book-open</a-icon>{{ state.survey.name }}</span>
        <a-btn @click="closeDialog" variant="flat"><a-icon>mdi-close</a-icon></a-btn>
      </a-card-title>
      <a-card-subtitle v-if="state.survey.meta.isLibrary" style="width: fit-content">
        <a-icon class="mr-1">mdi-note-multiple-outline</a-icon>
        {{ getCountSubmissions }}
        <a-tooltip right activator="parent">Number of submission using this</a-tooltip>
      </a-card-subtitle>
      <a-card-subtitle style="white-space: normal">
        <small class="text-grey">{{ state.survey._id }}</small>
        <a-chip small variant="outlined" color="grey" class="font-weight-medium ml-2">
          Version {{ state.survey.latestVersion }}
        </a-chip>
      </a-card-subtitle>
      <a-card-text style="overflow: auto !important; padding-bottom: 1rem; min-height: 150px">
        <a-row>
          <a-col v-if="state.survey.meta.isLibrary">
            <h4>Description</h4>
            <small v-html="state.survey.meta.libraryDescription" class="preview"></small>
            <br />
            <h4>Applications</h4>
            <small v-html="state.survey.meta.libraryApplications" class="preview"></small>
            <br />
            <h4>Maintainers</h4>
            <small v-html="state.survey.meta.libraryMaintainers" class="preview"></small>
            <br />
            <h4>Updates</h4>
            <small v-html="state.survey.meta.libraryHistory" class="preview"></small>
          </a-col>
          <a-col v-else>
            <h4>Description</h4>
            <small v-html="state.survey?.description" class="preview"></small>
          </a-col>
          <a-col>
            <h4>Questions</h4>
            <graphical-view
              v-if="state.survey"
              readOnly
              :scale="0.75"
              class="graphical-view"
              :modelValue="state.survey.revisions[state.survey.revisions.length - 1].controls" />
          </a-col>
        </a-row>
      </a-card-text>
    </a-card>
  </a-dialog>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useStore } from 'vuex';

import api from '@/services/api.service';
import { get } from 'lodash';

import graphicalView from '@/components/builder/GraphicalView.vue';

const store = useStore();
const { mobile } = useDisplay();

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  selectedSurvey: {
    type: undefined,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const state = reactive({
  survey: undefined,
  loading: false,
});

const getCountSubmissions = computed(() => {
  return props.selectedSurvey.meta.libraryUsageCountSubmissions
    ? props.selectedSurvey.meta.libraryUsageCountSubmissions
    : 0;
});

async function fetchData() {
  if (props.selectedSurvey) {
    const surveyId = props.selectedSurvey._id;

    try {
      const { data } = await api.get(`/surveys/${surveyId}`);
      state.survey = data;
    } catch (e) {
      console.log('Error fetching surveys:', e);
      store.dispatch('feedback/add', get(e, 'response.data.message', String(e)));
      closeDialog();
    } finally {
      state.loading = false;
    }
  }
  return;
}

function closeDialog() {
  emit('update:modelValue', false);
}

watch(
  () => props.modelValue,
  async (newVal) => {
    // if the dialog will be displayed
    if (newVal) {
      state.loading = true;
      await fetchData();
    }
  }
);
</script>

<style lang="scss">
.preview,
.preview * {
  padding: revert;
  margin: revert;
  max-width: 100%;
}
</style>
