<template>
  <v-expansion-panels flat multiple v-model="mainPanelState">
    <v-expansion-panel>
      <v-expansion-panel-header class="pl-0 pt-0">
        <h3>Change details</h3>
        <v-switch
          class="flex-grow-0 mr-6"
          v-if="isOpen"
          @click.native.stop=""
          v-model="showUnchangeds"
          :label="`show unchangeds`"
        ></v-switch>
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-expansion-panels>
          <v-expansion-panel v-for="item in items" :key="item.id">
            <v-expansion-panel-header>
              <v-row>
                <div class="v-treeview-node__level" v-for="index in item.depth" :key="index" />
                <th>
                  <v-icon :color="item.color">
                    {{ item.icon }}
                  </v-icon>
                  {{ item.name }}
                </th>
              </v-row>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-simple-table fixed-header>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th class="text-left">Property</th>
                      <th class="text-left">Change from v{{ oldRevision.version }} to v{{ newRevision.version }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="change in getControlChangeList(item.id)" :key="change.key">
                      <td>{{ change.key }}</td>
                      <td>{{ change.oldValue }} -> {{ change.newValue }}</td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
import { availableControls } from '@/utils/surveyConfig';
import { diffSurveyVersions, changeType } from '@/utils/surveyDiff';
import _ from 'lodash';

import { createSurvey } from '@/utils/surveys';
import { createControlInstance } from '@/utils/surveyConfig';
const oldRevision = { ...createSurvey({}).revisions[0], version: 1 };
oldRevision.controls.push(
  createControlInstance({ type: 'number', name: 'number_1' }),
  createControlInstance({ type: 'string', name: 'string_1' }),
  createControlInstance({
    type: 'page',
    name: 'page_1',
    children: [
      createControlInstance({ type: 'number', name: 'number_2' }),
      createControlInstance({ type: 'string', name: 'string_2' }),
    ],
  })
);
const newRevision = _.cloneDeep(oldRevision);
newRevision.controls[0].name = 'changed_name';
newRevision.controls.splice(1, 1);

export default {
  name: 'app-survey-diff',
  // components: {
  //   appControl,
  // },
  props: {
    oldRevision: { type: Object, default: oldRevision },
    newRevision: { type: Object, default: newRevision },
    defaultOpen: Boolean,
    defaultShowUnchangeds: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      isOpen: this.defaultOpen,
      showUnchangeds: this.defaultShowUnchangeds,
    };
  },

  computed: {
    diff() {
      if (this.oldRevision && this.newRevision) {
        return diffSurveyVersions(this.oldRevision, this.newRevision);
      }
      return [];
    },
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
      const convert = (diffs, depth = 0) => {
        return diffs
          .map((controlDiff) => {
            const control = controlDiff.newControl || controlDiff.oldControl;
            return [
              {
                controlDiff,
                id: control.id,
                name: control.name,
                icon: findIcon(control),
                color: changeColors[controlDiff.changeType],
                changeType: controlDiff.changeType,
                path: controlDiff.path,
                depth,
              },
              ...convert(childrenOf(control.id), depth + 1),
            ];
          })
          .flat();
      };
      let result = convert(childrenOf(null));
      if (!this.showUnchangeds) {
        result = result.filter((diff) => diff.changeType !== changeType.UNCHANGED);
      }
      return result;
    },
    mainPanelState: {
      get() {
        return this.isOpen ? [0] : [];
      },
      set(state) {
        this.isOpen = state.includes(0);
      },
    },
  },
  methods: {
    getControlChangeList(controlId) {
      const controlDiff = this.diff && this.diff.find((d) => d.controlId === controlId);
      if (!controlDiff || !controlDiff.diff) {
        return [];
      }
      return Object.entries(controlDiff.diff)
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
  },
};
</script>
