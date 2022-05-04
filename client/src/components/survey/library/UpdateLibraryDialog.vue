<template>
  <v-dialog :value="true" @input="(v) => $emit('input', v)" width="700" max-width="75%">
    <v-card>
      <v-card-title>
        Update question set from Version {{ libraryRootGroup.libraryVersion }} to Version
        {{ toSurvey.latestVersion }}
      </v-card-title>
      <v-card-text class="pb-0">
        <h3 class="mt-5 mb-2">Update notes from maintainer of question set "{{ toSurvey.name }}":</h3>
        <tip-tap-editor disabled v-model="toSurvey.meta.libraryHistory" class="mb-4" />
        <library-change-type-selector v-model="toSurvey.meta.libraryLastChangeType" :disabled="true" />
      </v-card-text>
      <survey-diff
        :controls-revision-a="remoteOldRevisionControls"
        :controls-revision-b="remoteNewRevisionControls"
        :version-name-revision-a="`Version ${libraryRootGroup.libraryVersion}`"
        :version-name-revision-b="`Version ${toSurvey.latestVersion}`"
        :default-open="true"
        :showHeader="true"
        :showNoChangesText="true"
      ></survey-diff>
      <div v-if="localRevisionHasChanges">
        <v-card-text class="ml-2 my-3" style="margin-bottom: -20px">
          <h3>
            <v-icon color="warning">mdi-alert</v-icon>&nbsp;<b
              >You have modified this question set compared to Version {{ libraryRootGroup.libraryVersion }}. The
              following changes will be reset due to conflicting changes:</b
            >
          </h3>
        </v-card-text>
        <survey-diff
          :controls-revision-a="localRevisionControls"
          :controls-revision-b="remoteOldRevisionControls"
          :controls-revision-c="remoteNewRevisionControls"
          :conflicting-changes-only="true"
          version-name-revision-a="Your modifications"
          :version-name-revision-b="`Version ${libraryRootGroup.libraryVersion}`"
          :version-name-revision-c="`Version ${toSurvey.latestVersion}`"
          :default-open="true"
          :showHeader="false"
          :showNoChangesText="false"
        ></survey-diff>
      </div>
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
          @click="update"
          color="primary"
          text
          :disabled="libraryRootGroup.libraryVersion === toSurvey.latestVersion"
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
import { controlListsHaveChanges, merge } from '@/utils/surveyDiff';
import { reactive, toRefs } from '@vue/composition-api';
import { getPreparedLibraryControls, getPreparedLibraryResources } from '@/utils/surveys';

export default {
  components: { SurveyDiff, LibraryChangeTypeSelector, TipTapEditor },
  props: {
    libraryRootGroup: {
      type: Object,
      required: true,
    },
    toSurvey: {
      type: Object,
      required: true,
    },
  },
  emits: ['update', 'cancel'],
  setup(props, { emit }) {
    const state = reactive({
      localRevisionControls: props.libraryRootGroup.children,
      remoteOldRevisionControls: null,
      remoteNewRevisionControls: null,
      localRevisionHasChanges: false,
    });

    state.remoteOldRevisionControls = props.toSurvey.revisions.find(
      (revision) => revision.version === props.libraryRootGroup.libraryVersion
    ).controls;
    state.remoteNewRevisionControls = props.toSurvey.revisions.find(
      (revision) => revision.version === props.toSurvey.latestVersion
    ).controls;

    state.localRevisionHasChanges = controlListsHaveChanges(
      state.localRevisionControls,
      state.remoteOldRevisionControls
    );

    function update() {
      //update updatedLibraryRootGroup
      let updatedLibraryRootGroup = { ...props.libraryRootGroup };
      updatedLibraryRootGroup.libraryVersion = props.toSurvey.latestVersion;
      //update resources
      const updatedResources = getPreparedLibraryResources(props.toSurvey);
      //update controls
      let updatedControls = merge(
        state.localRevisionControls,
        state.remoteOldRevisionControls,
        state.remoteNewRevisionControls
      );
      // add questions from library survey to question group
      updatedLibraryRootGroup.children = getPreparedLibraryControls(
        props.toSurvey._id,
        props.toSurvey.latestVersion,
        updatedControls,
        updatedResources
      );
      //emit containing updated controls and resources
      emit('update', { updatedLibraryRootGroup, updatedResources });
    }
    return {
      ...toRefs(state),
      update,
    };
  },
};
</script>
