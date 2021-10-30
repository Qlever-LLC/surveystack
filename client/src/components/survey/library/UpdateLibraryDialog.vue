<template>
  <v-dialog :value="value" @input="(v) => $emit('input', v)" width="700" max-width="75%">
    <v-card>
      <v-card-title>
        Update question set from Version {{ fromLibraryControl.libraryVersion }} to Version
        {{ toSurvey.latestVersion }}
      </v-card-title>
      <v-card-text class="pb-0">
        <h3 class="mt-5 mb-2">Updates notes from maintainer of question set "{{ toSurvey.name }}":</h3>
        <tip-tap-editor disabled v-model="toSurvey.meta.libraryHistory" class="mb-4" />
        <library-change-type-selector v-model="toSurvey.meta.libraryLastChangeType" :disabled="true" />
      </v-card-text>
      <v-card-text v-if="selectedRevisionsHaveDifference">
        <h3>
          <v-icon color="warning">mdi-alert</v-icon>&nbsp;<b
            >If you have modified this question set, your modifications will be reset.</b
          >
          Note all your modifications if you wish to re-apply them after updating.
        </h3>
      </v-card-text>
      <survey-diff
        :old-controls="fromLibraryRevision.controls"
        :new-controls="toLibraryRevision.controls"
        old-version-name="Your version"
        :new-version-name="`Version ${toLibraryRevision.version}`"
        :default-open="false"
        use-control-path-as-id
      ></survey-diff>
      <v-card-actions class="mr-3">
        <v-btn
          small
          href="https://our-sci.gitlab.io/software/surveystack_tutorials/question_types/"
          target="_blank"
          text
          >Learn more...</v-btn
        >
        <v-spacer />
        <v-btn
          @click="$emit('ok')"
          color="primary"
          text
          :disabled="fromLibraryControl.libraryVersion === toSurvey.latestVersion"
        >
          <span>update library</span>
        </v-btn>
        <v-btn @click="$emit('cancel')" color="primary" text> Cancel </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import TipTapEditor from '@/components/builder/TipTapEditor';
import LibraryChangeTypeSelector from '@/components/survey/library/LibraryChangeTypeSelector';
import SurveyDiff from '@/components/survey/SurveyDiff';
import { controlListsHaveChanges } from '@/utils/surveyDiff';
import { computed } from '@vue/composition-api';
export default {
  components: { SurveyDiff, LibraryChangeTypeSelector, TipTapEditor },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    fromLibraryControl: {
      type: Object,
      required: true,
    },
    toSurvey: {
      type: Object,
      required: true,
    },
  },
  emits: ['ok', 'cancel'],
  setup(props) {
    return {
      fromLibraryRevision: computed(() => {
        return props.toSurvey.revisions.find(
          (revision) => revision.version === props.fromLibraryControl.libraryVersion
        );
      }),
      toLibraryRevision: computed(() => {
        return props.toSurvey.revisions.find((revision) => revision.version === props.toSurvey.latestVersion);
      }),
    };
  },
  computed: {
    selectedRevisionsHaveDifference() {
      return controlListsHaveChanges(this.fromLibraryRevision.controls, this.toLibraryRevision.controls);
    },
  },
};
</script>
