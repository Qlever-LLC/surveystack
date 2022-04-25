<template>
  <v-dialog :value="value" @input="(v) => $emit('input', v)" width="700" max-width="75%">
    <v-card>
      <v-card-title>
        Update question set from Version {{ fromSurvey.libraryVersion }} to Version
        {{ toSurvey.latestVersion }}
      </v-card-title>
      <v-card-text class="pb-0">
        <h3 class="mt-5 mb-2">Update notes from maintainer of question set "{{ toSurvey.name }}":</h3>
        <tip-tap-editor disabled v-model="toSurvey.meta.libraryHistory" class="mb-4" />
        <library-change-type-selector v-model="toSurvey.meta.libraryLastChangeType" :disabled="true" />
      </v-card-text>
      <survey-diff
        :old-controls="remoteOldRevisionControls"
        :new-controls="remoteNewRevisionControls"
        :old-version-name="`Version ${fromSurvey.libraryVersion}`"
        :new-version-name="`Version ${toSurvey.latestVersion}`"
        :default-open="true"
        :showHeader="true"
        :showNoChangesText="true"
      ></survey-diff>
      <v-card-text v-if="localRevisionHasChanges" class="mt-3" style="margin-bottom: -20px">
        <h3>
          <v-icon color="warning">mdi-alert</v-icon>&nbsp;<b
            >You have modified this question set compared to Version {{ fromSurvey.libraryVersion }}. To following
            changes will be reset:</b
          >
        </h3>
      </v-card-text>
      <survey-diff
        :old-controls="localRevisionControls"
        :new-controls="remoteOldRevisionControls"
        old-version-name="Your modifications"
        :new-version-name="`Version ${fromSurvey.libraryVersion}`"
        :default-open="true"
        :showHeader="false"
        :showNoChangesText="false"
      ></survey-diff>
      <v-card-actions class="mr-3">
        <v-btn
          small
          href="https://our-sci.gitlab.io/software/surveystack_tutorials/question_types/"
          target="_blank"
          text
          >Learn more...
        </v-btn>
        <v-spacer />
        <v-btn
          @click="$emit('ok')"
          color="primary"
          text
          :disabled="fromSurvey.libraryVersion === toSurvey.latestVersion"
        >
          <span>update</span>
        </v-btn>
        <v-btn @click="$emit('cancel')" color="primary" text> Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import TipTapEditor from '@/components/builder/TipTapEditor';
import LibraryChangeTypeSelector from '@/components/survey/library/LibraryChangeTypeSelector';
import SurveyDiff from '@/components/survey/SurveyDiff';
import { controlListsHaveChanges } from '@/utils/surveyDiff';
import { reactive, toRefs } from '@vue/composition-api';

export default {
  components: { SurveyDiff, LibraryChangeTypeSelector, TipTapEditor },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    fromSurvey: {
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
    const state = reactive({
      localRevisionControls: props.fromSurvey.children,
      remoteOldRevisionControls: null,
      remoteNewRevisionControls: null,
      localRevisionHasChanges: false,
    });

    state.remoteOldRevisionControls = props.toSurvey.revisions.find(
      (revision) => revision.version === props.fromSurvey.libraryVersion
    ).controls;
    state.remoteNewRevisionControls = props.toSurvey.revisions.find(
      (revision) => revision.version === props.toSurvey.latestVersion
    ).controls;

    state.localRevisionHasChanges = controlListsHaveChanges(
      state.localRevisionControls,
      state.remoteOldRevisionControls
    );
    return {
      ...toRefs(state),
    };
  },
};
</script>
