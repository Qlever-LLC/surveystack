<template>
  <v-card-text v-if="changedItems.length === 0" class="d-flex">
    <v-icon color="success" class="mr-1">mdi-check-bold</v-icon>
    <h3 class="flex-grow-0 mr-6">No changes detected</h3>
  </v-card-text>
  <v-expansion-panels v-else flat multiple v-model="mainPanelState">
    <v-expansion-panel>
      <v-expansion-panel-header class="pt-0">
        <h3 class="flex-grow-0 mr-6">Change details</h3>

        <v-tooltip bottom v-for="{ icon, color, count, tooltip } in changeSummaryList" :key="icon">
          <template v-slot:activator="{ on, attrs }">
            <span class="flex-grow-0 mr-2" v-bind="attrs" v-on="on"
              ><v-badge overlap bordered left :color="color" :content="count.toString()">
                <v-icon :color="color">{{ icon }}</v-icon>
              </v-badge></span
            >
          </template>
          <span>{{ tooltip }}</span>
        </v-tooltip>

        <v-spacer />
        <v-switch
          class="flex-grow-0 mr-6"
          v-if="isOpen"
          @click.native.stop=""
          v-model="showUnchanged"
          label="show unchanged"
        ></v-switch>
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-expansion-panels>
          <v-expansion-panel
            v-for="item in showUnchanged ? items : changedItems"
            :disabled="!item.isChanged"
            :key="item.id"
          >
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
                      <th class="text-left">Previous</th>
                      <th class="text-left">Next</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="change in getControlChangeList(item.id)" :key="change.key">
                      <td>{{ change.key }}</td>
                      <td>{{ change.oldValue }}</td>
                      <td>{{ change.newValue }}</td>
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
import { isNumber, sortBy } from 'lodash';

export default {
  name: 'survey-diff',
  props: {
    oldControls: Array,
    newControls: Array,
    defaultOpen: Boolean,
    defaultShowUnchanged: {
      type: Boolean,
      default: true,
    },
    useControlPathAsId: {
      type: Boolean,
      default: false,
    },
    oldVersionName: {
      type: String,
      required: true,
    },
    newVersionName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isOpen: this.defaultOpen,
      showUnchanged: this.defaultShowUnchanged,
      colors: {
        changed: 'amber lighten-1',
        added: 'green lighten-1',
        removed: 'red lighten-1',
      },
    };
  },

  computed: {
    diff() {
      if (this.oldControls && this.newControls) {
        return diffSurveyVersions(this.oldControls, this.newControls, { useControlPathAsId: this.useControlPathAsId });
      }
      return [];
    },
    items() {
      if (!this.diff) {
        return [];
      }

      const childrenOf = (parent) => this.diff.filter((d) => (d.newParentId || d.oldParentId || null) === parent);
      const findIcon = (control) => {
        const match = availableControls.find((c) => c.type === control.type);
        return match ? match.icon : '';
      };
      const getSortKey = (diff) => (isNumber(diff.newChildIndex) ? diff.newChildIndex : diff.oldChildIndex);
      const convert = (diffs, depth = 0) => {
        // sort to make the order similart to the original
        return sortBy(diffs, getSortKey)
          .map((controlDiff) => {
            const control = controlDiff.newControl || controlDiff.oldControl;
            return [
              {
                controlDiff,
                id: controlDiff.matchId,
                name: control.name,
                icon: findIcon(control),
                color: this.colors[controlDiff.changeType],
                changeType: controlDiff.changeType,
                isChanged: controlDiff.changeType === changeType.CHANGED,
                path: controlDiff.path,
                depth,
              },
              ...convert(childrenOf(control.id), depth + 1),
            ];
          })
          .flat();
      };
      return convert(childrenOf(null));
    },
    changedItems() {
      const hasChange = (itemIdx) => {
        const item = this.items[itemIdx];
        // check if the item is changed
        if (item.changeType !== changeType.UNCHANGED) {
          return true;
        }
        // check if any of its children are changed
        for (let i = itemIdx; i < this.items.length; i++) {
          if (this.items[i].depth <= item.depth) {
            break;
          }
          if (this.items[i].changeType !== changeType.UNCHANGED) {
            return true;
          }
        }
        return false;
      };
      return this.items.filter((_, idx) => hasChange(idx));
    },
    changeSummaryList() {
      let changed = 0;
      let removed = 0;
      let added = 0;
      for (const item of this.items) {
        switch (item.changeType) {
          case changeType.CHANGED:
            changed++;
            break;
          case changeType.REMOVED:
            removed++;
            break;
          case changeType.ADDED:
            added++;
            break;
        }
      }
      const info = (count, color, icon, tooltip) => ({ count, color, icon, tooltip });
      return [
        info(added, this.colors.added, 'mdi-book-plus', `${added} added`),
        info(changed, this.colors.changed, 'mdi-book', `${changed} changed`),
        info(removed, this.colors.removed, 'mdi-book-remove', `${removed} removed`),
      ].filter((i) => i.count > 0);
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
    getControlChangeList(matchId) {
      const controlDiff = this.diff && this.diff.find((d) => d.matchId === matchId);
      if (!controlDiff || !controlDiff.diff) {
        return [];
      }
      return Object.entries(controlDiff.diff)
        .map(([key, change]) => {
          if (change.changeType !== changeType.UNCHANGED) {
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
