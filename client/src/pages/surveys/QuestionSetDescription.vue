<template>
  <a-container v-if="state.loading" class="d-flex align-center justify-center" cssHeight100>
    <a-progress-circular :size="50" />
  </a-container>
  <a-container v-else>
    <a-card color="background" class="pa-4">
      <a-row cssMinHeight96px>
        <a-col cssMinWidth0px>
          <div class="title text-truncate">
            {{ state.selectedSurvey.name }}
          </div>
          <div>
            <a-icon class="mr-1">mdi-note-multiple-outline</a-icon>
            {{
              state.selectedSurvey.meta.libraryUsageCountSubmissions
                ? state.selectedSurvey.meta.libraryUsageCountSubmissions
                : 0
            }}
            <a-tooltip bottom activator="parent">Number of submission using this</a-tooltip>
          </div>
          <div>
            <small class="text-grey">{{ state.selectedSurvey._id }}</small>
          </div>
          <a-chip small variant="outlined" color="grey" class="font-weight-medium mt-1">
            Version {{ state.selectedSurvey.latestVersion }}
          </a-chip>
        </a-col>
        <a-col>
          <a-btn
            color="white"
            key="library"
            :to="{ name: 'group-surveys-new', query: { libId: state.selectedSurvey._id } }"
            class="d-inline-block shadow bg-green span-button align-content-center"
            outlined
            small>
            add to new survey
          </a-btn>
        </a-col>
      </a-row>

      <a-row>
        <a-col>
          <h4>Description</h4>
          <small v-html="state.selectedSurvey.meta.libraryDescription" class="preview"></small>
          <br />
          <h4>Applications</h4>
          <small v-html="state.selectedSurvey.meta.libraryApplications" class="preview"></small>
          <br />
          <h4>Maintainers</h4>
          <small v-html="state.selectedSurvey.meta.libraryMaintainers" class="preview"></small>
          <br />
          <h4>Updates</h4>
          <small v-html="state.selectedSurvey.meta.libraryHistory" class="preview"></small>
        </a-col>
        <a-col>
          <h4>Questions</h4>
          <graphical-view
            v-if="state.selectedSurvey"
            readOnly
            :scale="0.75"
            class="graphical-view"
            :modelValue="state.selectedSurvey.revisions[state.selectedSurvey.revisions.length - 1].controls" />
        </a-col>
      </a-row>
    </a-card>
  </a-container>
</template>

<script setup>
import { reactive } from 'vue';
import { useRoute } from 'vue-router';

import api from '@/services/api.service';

import graphicalView from '@/components/builder/GraphicalView.vue';

const route = useRoute();

const state = reactive({
  selectedSurvey: undefined,
  loading: false,
});

fetchData();

async function fetchData() {
  const { qsId } = route.params;

  try {
    state.loading = true;
    const { data } = await api.get(`/surveys/${qsId}`);
    state.loading = false;
    state.selectedSurvey = data;
  } catch (e) {
    console.log('Error fetching surveys:', e);
  }
  return;
}
</script>

<style lang="scss">
.preview,
.preview * {
  padding: revert;
  margin: revert;
  max-width: 100%;
}
</style>
