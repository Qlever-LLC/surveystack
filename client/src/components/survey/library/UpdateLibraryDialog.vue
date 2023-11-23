<template>
  <a-dialog :value="value" @input="(v) => $emit('input', v)" width="700" max-width="75%" persistent>
    <a-card>
      <a-card-title>
        Update question set from Version
        <a-chip dark small color="green" class="mx-2"> Version {{ libraryRootGroup.libraryVersion }} </a-chip>
        to
        <a-chip dark small color="green" class="mx-2"> Version {{ toSurvey.latestVersion }} </a-chip>
      </a-card-title>
      <a-card-text class="mt-5">
        <h3 class="mb-2" style="color: rgba(0, 0, 0, 0.87); font-size: 17.55px">Update Notes</h3>
        <tip-tap-editor disabled v-model="toSurvey.meta.libraryHistory" class="mb-2" />
        <library-change-type-selector v-model="toSurvey.meta.libraryLastChangeType" :disabled="true" />
      </a-card-text>
      <survey-diff
        :controls-local-revision="localRevisionControls"
        :controls-remote-revision-old="remoteOldRevisionControls"
        :controls-remote-revision-new="remoteNewRevisionControls"
        :version-name-remote-revision-old="`Version ${libraryRootGroup.libraryVersion}`"
        :version-name-remote-revision-new="`Version ${toSurvey.latestVersion}`"
        :default-open="true"
        :showHeader="true"
        :showNoChangesText="false"
        @discard-local-changes-changed="discardLocalChangesChanged"
      ></survey-diff>
      <a-card-actions class="mr-3">
        <a-btn small href="https://our-sci.gitlab.io/software/surveystack_tutorials/QSL/" target="_blank" text
          >Learn more...
        </a-btn>
        <a-spacer />
        <a-btn
          @click="update"
          color="primary"
          text
          :disabled="libraryRootGroup.libraryVersion === toSurvey.latestVersion"
        >
          <span>update</span>
        </a-btn>
        <a-btn @click="$emit('cancel')" color="primary" text> Cancel</a-btn>
      </a-card-actions>
    </a-card>
    <a-dialog v-if="conflictConfirmModalIsVisible" v-model="conflictConfirmModalIsVisible" max-width="290">
      <a-card>
        <a-card-title>Confirm Update</a-card-title>
        <a-card-text class="mt-4">
          <b
            >You have modified this question set compared to Version
            {{ libraryRootGroup.libraryVersion }}.<br /><br />You have chosen to override
            {{ discardLocalChanges.length }} of your modified questions.<br /><br />Click update to continue.</b
          >
        </a-card-text>
        <a-card-actions>
          <a-spacer />
          <a-btn text @click.stop="conflictConfirmModalIsVisible = false"> Cancel</a-btn>
          <a-btn text color="red" @click.stop="updateConfirmed"> Update</a-btn>
        </a-card-actions>
      </a-card>
    </a-dialog>
  </a-dialog>
</template>

<script>
import TipTapEditor from '@/components/builder/TipTapEditor';
import LibraryChangeTypeSelector from '@/components/survey/library/LibraryChangeTypeSelector';
import SurveyDiff from '@/components/survey/SurveyDiff';
import { merge } from '@/utils/surveyDiff';
import { reactive, toRefs } from '@vue/composition-api';

export default {
  components: {
    SurveyDiff,
    LibraryChangeTypeSelector,
    TipTapEditor,
  },
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
      discardLocalChanges: [],
      remoteOldRevisionControls: null,
      remoteNewRevisionControls: null,
      conflictConfirmModalIsVisible: false,
    });

    state.remoteOldRevisionControls = props.toSurvey.revisions.find(
      (revision) => revision.version === props.libraryRootGroup.libraryVersion
    ).controls;
    state.remoteNewRevisionControls = props.toSurvey.revisions.find(
      (revision) => revision.version === props.toSurvey.latestVersion
    ).controls;

    function update() {
      if (state.discardLocalChanges && state.discardLocalChanges.length > 0) {
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
        state.remoteNewRevisionControls,
        state.discardLocalChanges
      );
      //emit containing updated controls and resources
      emit('update', updatedLibraryControls);
    }

    function discardLocalChangesChanged(discardLocalChanges) {
      state.discardLocalChanges = discardLocalChanges;
    }

    return {
      ...toRefs(state),
      update,
      updateConfirmed,
      discardLocalChangesChanged,
    };
  },
};
</script>
