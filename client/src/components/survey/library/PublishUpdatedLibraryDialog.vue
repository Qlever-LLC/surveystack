<template>
  <v-dialog :value="value" @input="(v) => $emit('input', v)" width="700" max-width="75%">
    <v-card>
      <v-card-title> Publish Update To Library </v-card-title>
      <v-card-text class="pb-0">
        <h3>Version history</h3>
        <tip-tap-editor v-model="localLibrarySurvey.meta.libraryHistory" class="mb-4" />
        <library-change-type-selector v-model="localLibrarySurvey.meta.libraryLastChangeType" :disabled="false" />
      </v-card-text>
      <survey-diff
        :controls-revision-a="
          localLibrarySurvey.revisions.find((revision) => revision.version === localLibrarySurvey.latestVersion)
            .controls
        "
        :controls-revision-b="localLibrarySurvey.revisions[localLibrarySurvey.revisions.length - 1].controls"
        :default-open="false"
        :version-name-revision-a="`Version ${localLibrarySurvey.latestVersion}`"
        :version-name-revision-b="`Version ${
          localLibrarySurvey.revisions[localLibrarySurvey.revisions.length - 1].version
        }`"
      ></survey-diff>
      <v-card-actions class="mr-3">
        <v-spacer />
        <v-btn @click="$emit('ok', localLibrarySurvey)" color="primary" text>
          <span>Publish update to library {{ value.name }}</span>
        </v-btn>
        <v-btn @click="$emit('cancel')" color="primary" text> Cancel </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import LibraryChangeTypeSelector from '@/components/survey/library/LibraryChangeTypeSelector';
import TipTapEditor from '@/components/builder/TipTapEditor.vue';
import { reactive, toRefs } from '@vue/composition-api';
import SurveyDiff from '@/components/survey/SurveyDiff';

export default {
  name: 'publish-updated-library-dialog',
  components: { SurveyDiff, LibraryChangeTypeSelector, TipTapEditor },
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
