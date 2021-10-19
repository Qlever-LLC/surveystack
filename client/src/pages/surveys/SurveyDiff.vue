<template>
  <v-row>
    <v-treeview open-all :items="items" activatable @update:active="handleSelectControl">
      <template v-slot:prepend="{ item }">
        <v-icon :color="item.color">
          {{ item.icon }}
        </v-icon>
      </template>
    </v-treeview>
    <v-col v-if="previewVersion">
      <v-btn-toggle v-model="previewVersion" tile color="deep-purple accent-3" group>
        <v-btn :value="oldVersion"> Version {{ oldVersion }} </v-btn>

        <v-btn :value="newVersion"> Version {{ newVersion }} </v-btn>
      </v-btn-toggle>
      <app-control
        v-if="selectedControl && survey"
        :control="selectedControl"
        :path="selectedControlPath"
        :survey="survey"
        :key="selectedControlPath + '@' + previewVersion"
      />
      <v-simple-table fixed-header height="300px">
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">
                Property
              </th>
              <th class="text-left">Change from v{{ oldVersion }} to v{{ newVersion }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="change in selectedChangeList" :key="change.key">
              <td>{{ change.key }}</td>
              <td>{{ change.oldValue }} -> {{ change.newValue }}</td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
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
      oldVersion: null,
      newVersion: null,
      previewVersion: null,
    };
  },

  computed: {
    items() {
      if (!this.diff) {
        return [];
      }

      const childrenOf = (parent) => this.diff.filter((d) => (d.newParentId || d.oldParentId || null) === parent); //TODO sort
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
        (this.previewVersion === this.newVersion
          ? this.selectedControlDiff.newControl
          : this.selectedControlDiff.oldControl)
      );
    },
    selectedControlPath() {
      return (
        this.selectedControlDiff &&
        (this.previewVersion === this.newVersion ? this.selectedControlDiff.newPath : this.selectedControlDiff.oldPath)
      );
    },
    selectedChangeList() {
      if (!this.selectedControlDiff || !this.selectedControlDiff.diff) {
        return [];
      }
      return Object.entries(this.selectedControlDiff.diff)
        .map(([key, change]) => {
          if (change.changeType === 'changed') {
            return {
              key,
              oldValue: JSON.stringify(change.oldValue),
              newValue: JSON.stringify(change.newValue),
            };
          }
          return null;
        })
        .filter((c) => c !== null);
    },
    previewResources() {
      return {
        survey: this.survey,
        previewVersion: this.previewVersion,
      };
    },
  },
  watch: {
    previewResources({ survey, previewVersion }) {
      console.log({ survey, previewVersion });
      if (survey && previewVersion) {
        const submission = submissionUtils.createSubmissionFromSurvey({
          survey,
          version: previewVersion,
          instance: null,
        });
        this.$store.dispatch('draft/init', { survey, submission, persist: false });
      }
    },
  },
  methods: {
    handleSelectControl([controlId]) {
      this.selectedControlId = controlId;
    },
  },
  async created() {
    // TODO handle error
    const { id, oldVersion, newVersion } = this.$route.params;
    this.oldVersion = parseInt(oldVersion);
    this.newVersion = parseInt(newVersion);
    this.previewVersion = this.newVersion;
    // TODO load through $store
    const { data: diff } = await api.get(`/surveys/diff/${id}/${oldVersion}/${newVersion}`);
    this.diff = diff;
    const { data: survey } = await api.get(`/surveys/${id}`);
    this.survey = survey;
  },
};
</script>
