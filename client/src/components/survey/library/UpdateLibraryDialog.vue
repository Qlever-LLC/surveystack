<template>
  <v-dialog :value="value" @input="(v) => $emit('input', v)" width="700" max-width="75%" persistent>
    <v-card>
      <v-card-title>
        Update question set from Version
        <v-chip dark small color="green" class="mx-2"> Version {{ libraryRootGroup.libraryVersion }} </v-chip>
        to
        <v-chip dark small color="green" class="mx-2"> Version {{ toSurvey.latestVersion }} </v-chip>
      </v-card-title>
      <v-card-text class="mt-5">
        <h3 class="mb-2" style="color: rgba(0, 0, 0, 0.87); font-size: 17.55px">Update Notes</h3>
        <tip-tap-editor disabled v-model="toSurvey.meta.libraryHistory" class="mb-2" />
        <library-change-type-selector v-model="toSurvey.meta.libraryLastChangeType" :disabled="true" />
      </v-card-text>
      <survey-diff
        :controls-local-revision="localRevisionControls"
        :controls-remote-revision-old="remoteOldRevisionControls"
        :controls-remote-revision-new="remoteNewRevisionControls"
        :version-name-remote-revision-old="`Version ${libraryRootGroup.libraryVersion}`"
        :version-name-remote-revision-new="`Version ${toSurvey.latestVersion}`"
        :default-open="true"
        :showHeader="true"
        :showNoChangesText="false"
      ></survey-diff>
      <div v-if="hasBreakingChanges">
        <v-card-text class="ml-2 my-3" style="margin-bottom: -20px">
          <h3>
            <v-icon color="warning">mdi-alert</v-icon>&nbsp;
            <b v-html="breakingChangeText" />
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
          <b v-html="breakingChangeText" />
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
import { diffHasBreakingChanges, merge } from '@/utils/surveyDiff';
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
      hasBreakingChanges: false,
      conflictConfirmModalIsVisible: false,
      breakingChangeText:
        'You have modified this question set compared to Version ' +
        props.libraryRootGroup.libraryVersion +
        ". Your changes marked as 'breaking change' will be reset to the latest library version.",
    });

    state.remoteOldRevisionControls = props.toSurvey.revisions.find(
      (revision) => revision.version === props.libraryRootGroup.libraryVersion
    ).controls;
    state.remoteNewRevisionControls = props.toSurvey.revisions.find(
      (revision) => revision.version === props.toSurvey.latestVersion
    ).controls;

    state.hasBreakingChanges = diffHasBreakingChanges(
      state.localRevisionControls,
      state.remoteOldRevisionControls,
      state.remoteNewRevisionControls
    );

    function update() {
      if (state.hasBreakingChanges) {
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
