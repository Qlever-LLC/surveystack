<template>
  <a-dialog
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    width="700"
    max-width="75%">
    <a-card>
      <a-card-title>
        Publish
        <a-chip small color="green" class="mx-2">
          Version {{ localLibrarySurvey.revisions[localLibrarySurvey.revisions.length - 1].version }}
        </a-chip>
        to Library
      </a-card-title>
      <a-card-text>
        <h3 class="mb-2" style="color: rgba(0, 0, 0, 0.87); font-size: 17.55px">Update Notes</h3>
        <tip-tap-editor v-model="localLibrarySurvey.meta.libraryHistory" class="mt-2" />
        <library-change-type-selector
          v-model="localLibrarySurvey.meta.libraryLastChangeType"
          :disabled="false"
          class="mt-5" />
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
        class="mt-4" />
      <a-card-actions class="mr-3">
        <a-spacer />
        <a-btn @click="$emit('ok', localLibrarySurvey)" color="primary" variant="text">
          <span>Publish update to library {{ modelValue.name }}</span>
        </a-btn>
        <a-btn @click="$emit('cancel')" color="primary" variant="text"> Cancel</a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>
<script>
import LibraryChangeTypeSelector from '@/components/survey/library/LibraryChangeTypeSelector';
import TipTapEditor from '@/components/builder/TipTapEditor.vue';
import { reactive, toRefs } from 'vue';
import SurveyDiff from '@/components/survey/SurveyDiff';

export default {
  name: 'publish-updated-library-dialog',
  components: {
    SurveyDiff,
    LibraryChangeTypeSelector,
    TipTapEditor,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    librarySurvey: {
      type: Object,
      required: true,
    },
  },
  emits: ['ok', 'cancel', 'update:modelValue'],
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
<style scoped lang="scss">
.survey-group-name-input >>> .v-input__slot ::before {
  border: none;
}

.survey-group-name-input >>> .v-input__control >>> .v-input__slot ::before {
  border: none;
}
</style>
