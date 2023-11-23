<template>
  <a-dialog :value="value" @input="(v) => $emit('input', v)" width="700" max-width="75%">
    <a-card>
      <a-card-title>
        Publish
        <a-chip dark small color="green" class="mx-2">
          Version {{ localLibrarySurvey.revisions[localLibrarySurvey.revisions.length - 1].version }}
        </a-chip>
        to Library
      </a-card-title>
      <a-card-text class="mt-5">
        <h3 class="mb-2" style="color: rgba(0, 0, 0, 0.87); font-size: 17.55px">Update Notes</h3>
        <tip-tap-editor v-model="localLibrarySurvey.meta.libraryHistory" class="mb-2" />
        <library-change-type-selector v-model="localLibrarySurvey.meta.libraryLastChangeType" :disabled="false" />
      </a-card-text>
      <survey-diff
        :controls-remote-revision-old="
          localLibrarySurvey.revisions.find((revision) => revision.version === localLibrarySurvey.latestVersion)
            .controls
        "
        :controls-remote-revision-new="localLibrarySurvey.revisions[localLibrarySurvey.revisions.length - 1].controls"
        :default-open="false"
        :version-name-remote-revision-old="`Version ${localLibrarySurvey.latestVersion}`"
        :version-name-remote-revision-new="`Version ${
          localLibrarySurvey.revisions[localLibrarySurvey.revisions.length - 1].version
        }`"
      />
      <a-card-actions class="mr-3">
        <a-spacer />
        <v-btn @click="$emit('ok', localLibrarySurvey)" color="primary" text>
          <span>Publish update to library {{ value.name }}</span>
        </v-btn>
        <v-btn @click="$emit('cancel')" color="primary" text> Cancel </v-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>
<script>
import LibraryChangeTypeSelector from '@/components/survey/library/LibraryChangeTypeSelector';
import TipTapEditor from '@/components/builder/TipTapEditor.vue';
import { reactive, toRefs } from '@vue/composition-api';
import SurveyDiff from '@/components/survey/SurveyDiff';

export default {
  name: 'publish-updated-library-dialog',
  components: {
    SurveyDiff,
    LibraryChangeTypeSelector,
    TipTapEditor,
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    librarySurvey: {
      type: Object,
      required: true,
    },
  },
  emits: ['ok', 'cancel'],
  setup(props) {
    const state = reactive({
      localLibrarySurvey: props.librarySurvey,
    });

    const versionHistoryText =
      '<p>Version ' +
      state.localLibrarySurvey.revisions[state.localLibrarySurvey.revisions.length - 1].version +
      '</p>';
    const ul = '<ul><li></li></ul>';

    if (state.localLibrarySurvey.meta.libraryHistory.indexOf(versionHistoryText) === -1) {
      state.localLibrarySurvey.meta.libraryHistory =
        versionHistoryText + ul + state.localLibrarySurvey.meta.libraryHistory;
    }

    return {
      ...toRefs(state),
    };
  },
};
</script>
<style scoped>
.survey-group-name-input >>> .v-input__slot ::before {
  border: none;
}

.survey-group-name-input >>> .v-input__control >>> .v-input__slot ::before {
  border: none;
}
</style>
