<template>
  <v-dialog :value="value" @input="(v) => $emit('input', v)" width="700" max-width="75%" persistent>
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
        :controls-revision-a="localRevisionControls"
        :controls-revision-b="remoteOldRevisionControls"
        :controls-revision-c="remoteNewRevisionControls"
        version-name-revision-a="Your Version"
        :version-name-revision-b="`Version ${libraryRootGroup.libraryVersion}`"
        :version-name-revision-c="`Version ${toSurvey.latestVersion}`"
        :default-open="true"
        :showHeader="true"
        :showNoChangesText="false"
      ></survey-diff>
      <div v-if="hasConflicts">
        <v-card-text class="ml-2 my-3" style="margin-bottom: -20px">
          <h3>
            <v-icon color="warning">mdi-alert</v-icon>&nbsp;
            <b
              >You have modified this question set compared to Version {{ libraryRootGroup.libraryVersion }}. Your
              changes marked as CONFLICT will be reset to the latest library version.
            </b>
          </h3>
        </v-card-text>
      </div>
      <v-card-actions class="mr-3">
        <v-btn small href="https://our-sci.gitlab.io/software/surveystack_tutorials/QSL/" target="_blank" text
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
    <v-dialog v-if="conflictConfirmModalIsVisible" v-model="conflictConfirmModalIsVisible" max-width="290">
      <v-card class="">
        <v-card-title> Confirm Update</v-card-title>
        <v-card-text class="mt-4">
          <v-icon color="warning">mdi-alert</v-icon>&nbsp;
          <b
            >You have modified this question set compared to Version {{ libraryRootGroup.libraryVersion }}. Your changes
            marked as CONFLICT will be reset to the latest library version.
          </b>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click.stop="conflictConfirmModalIsVisible = false"> Cancel</v-btn>
          <v-btn text color="red" @click.stop="updateConfirmed"> Update</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script>
import TipTapEditor from '@/components/builder/TipTapEditor';
import LibraryChangeTypeSelector from '@/components/survey/library/LibraryChangeTypeSelector';
import SurveyDiff from '@/components/survey/SurveyDiff';
import { diffHasConflicts, merge } from '@/utils/surveyDiff';
import { reactive, toRefs } from '@vue/composition-api';

export default {
  components: { SurveyDiff, LibraryChangeTypeSelector, TipTapEditor },
  props: {
    value: {
      required: true,
      type: Boolean,
    },
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
      hasConflicts: false,
      conflictConfirmModalIsVisible: false,
    });

    state.remoteOldRevisionControls = props.toSurvey.revisions.find(
      (revision) => revision.version === props.libraryRootGroup.libraryVersion
    ).controls;
    state.remoteNewRevisionControls = props.toSurvey.revisions.find(
      (revision) => revision.version === props.toSurvey.latestVersion
    ).controls;

    state.hasConflicts = diffHasConflicts(
      state.localRevisionControls,
      state.remoteOldRevisionControls,
      state.remoteNewRevisionControls
    );

    function update() {
      if (state.hasConflicts) {
        state.conflictConfirmModalIsVisible = true;
      } else {
        updateConfirmed();
      }
    }

    function updateConfirmed() {
      //update controls
      let updatedLibraryControls = merge(
        state.localRevisionControls,
        state.remoteOldRevisionControls,
        state.remoteNewRevisionControls
      );
      //emit containing updated controls and resources
      emit('update', updatedLibraryControls);
    }

    return {
      ...toRefs(state),
      update,
      updateConfirmed,
    };
  },
};
</script>
