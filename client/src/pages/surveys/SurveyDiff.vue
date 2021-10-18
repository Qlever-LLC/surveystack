<template>
  <v-row>
    <v-treeview open-all :items="items" activatable @update:active="handleSelect">
      <template v-slot:prepend="{ item }">
        <v-icon :color="item.color">
          {{ item.icon }}
        </v-icon>
      </template>
    </v-treeview>
    <v-col>
      <app-control v-if="selectedControl" :control="selectedControl" :path="selectedControlPath" :survey="survey" />
    </v-col>
  </v-row>
</template>

<script>
import api from '@/services/api.service';
import appControl from '@/components/survey/drafts/Control.vue';
import { createControlInstance, availableControls } from '@/utils/surveyConfig';
import submissionUtils from '@/utils/submissions';
import _ from 'lodash';

export default {
  name: 'app-survey-diff',
  components: {
    appControl,
  },
  data() {
    return {
      diff: null,
      survey: null,
      selectedControlId: null,
      watchNew: true,
    };
  },

  computed: {
    items() {
      if (!this.diff) {
        return [];
      }

      const childrenOf = (parent) => this.diff.filter((d) => (d.newParentId || d.oldParentId) === parent); //TODO sort
      const findIcon = (control) => {
        const match = availableControls.find((c) => c.type === control.type);
        return match ? match.icon : '';
      };
      const changeColors = {
        changed: 'amber',
        added: 'green',
        removed: 'red',
      };
      const convert = (diffs) => {
        return diffs.map((controlDiff) => {
          const control = controlDiff.newControl || controlDiff.oldControl;
          return {
            controlDiff,
            id: control.id,
            name: control.name,
            icon: findIcon(control),
            color: changeColors[controlDiff.changeType],
            changeType: controlDiff.changeType,
            path: controlDiff.path,
            children: convert(childrenOf(control.id)),
          };
        });
      };
      return convert(childrenOf(null));
    },
    selectedControlDiff() {
      return this.diff && this.diff.find((d) => d.controlId === this.selectedControlId);
    },
    selectedControl() {
      return (
        this.selectedControlDiff &&
        (this.watchNew ? this.selectedControlDiff.newControl : this.selectedControlDiff.oldControl)
      );
    },
    selectedControlPath() {
      return (
        this.selectedControlDiff &&
        (this.watchNew ? this.selectedControlDiff.newPath : this.selectedControlDiff.oldPath)
      );
    },
  },
  methods: {
    handleSelect([controlId]) {
      this.selectedControlId = controlId;
    },
  },
  async created() {
    // TODO handle error
    const { id, oldVersion, newVersion } = this.$route.params;
    // TODO load through $store
    const { data: diff } = await api.get(`/surveys/diff/${id}/${oldVersion}/${newVersion}`);
    this.diff = diff;
    const { data: survey } = await api.get(`/surveys/${id}`);
    this.survey = survey;
    const submission = submissionUtils.createSubmissionFromSurvey({
      survey: this.survey,
      version: 1,
      instance: null,
    });
    this.$store.dispatch('draft/init', { survey, submission, persist: false });
  },
};
</script>
