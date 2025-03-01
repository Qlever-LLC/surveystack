<template>
  <a-card-text v-if="!haveChanges && showNoChangesText" class="d-flex">
    <a-icon color="success" class="mr-1">mdi-check-bold</a-icon>
    <h3 class="flex-grow-0 mr-6">No changes detected</h3>
  </a-card-text>
  <a-expansion-panels v-else multiple v-model="mainPanelState">
    <a-expansion-panel elevation="0">
      <a-expansion-panel-title v-if="showHeader" class="pt-0" cssTransparentOverlay>
        <h3 class="flex-grow-0 mr-6">Update details</h3>

        <span v-for="{ icon, color, count, tooltip } in changeSummaryList" :key="icon" class="flex-grow-0 mr-2">
          <a-badge bordered left :color="color" :content="count.toString()">
            <a-icon :color="color">{{ icon }}</a-icon>
          </a-badge>
          <a-tooltip bottom activator="parent">{{ tooltip }}</a-tooltip>
        </span>

        <a-spacer />
        <a-switch
          class="flex-grow-0 mr-6"
          v-if="isOpen"
          @click.stop=""
          v-model="showChangesOnly"
          label="changes only"
          hideDetails />
      </a-expansion-panel-title>
      <a-expansion-panel-text>
        <survey-diff-card-tree
          :diffInfoTree="showChangesOnly ? diffInfoTreeWithoutUnchangeds : diffInfoTree"
          :version-name-local-revision="controlsLocalRevision ? 'Your Version' : null"
          :version-name-remote-revision-old="versionNameRemoteRevisionOld"
          :version-name-remote-revision-new="versionNameRemoteRevisionNew"
          @discard-changed="discardChanged" />
      </a-expansion-panel-text>
    </a-expansion-panel>
  </a-expansion-panels>
</template>

<script>
import { changeType, diffSurveyVersions, diffThreeSurveyVersions } from '@/utils/surveyDiff';
import { get, isNumber, remove, sortBy } from 'lodash';
import SurveyDiffCardTree from './SurveyDiffCardTree';

export default {
  name: 'survey-diff',
  components: {
    SurveyDiffCardTree,
  },
  props: {
    controlsLocalRevision: Array,
    controlsRemoteRevisionOld: Array,
    controlsRemoteRevisionNew: Array,
    versionNameRemoteRevisionOld: {
      type: String,
      required: true,
    },
    versionNameRemoteRevisionNew: {
      type: String,
      required: false,
    },
    defaultOpen: {
      type: Boolean,
      default: false,
    },
    defaultShowUnchanged: {
      type: Boolean,
      default: false,
    },
    showHeader: {
      type: Boolean,
      default: true,
    },
    showNoChangesText: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isOpen: this.defaultOpen,
      showChangesOnly: !this.defaultShowUnchanged,
      colors: {
        changed: 'amber-lighten-1',
        added: 'green-lighten-1',
        removed: 'red-lighten-1',
      },
      localChangesToDiscard: [],
    };
  },

  computed: {
    diff() {
      if (this.controlsRemoteRevisionNew && this.controlsRemoteRevisionOld) {
        if (this.controlsLocalRevision) {
          return diffThreeSurveyVersions(
            this.controlsLocalRevision,
            this.controlsRemoteRevisionOld,
            this.controlsRemoteRevisionNew
          );
        } else {
          return diffSurveyVersions(this.controlsRemoteRevisionOld, this.controlsRemoteRevisionNew);
        }
      }

      return [];
    },
    haveChanges() {
      return this.diff.some((diff) => diff.changeType !== changeType.UNCHANGED);
    },
    diffInfoTree() {
      if (!this.diff) {
        return [];
      }
      // consume this array to protect against circular dependencies
      const unsortedDiffs = [...this.diff];
      // returns the direct A/B revision children of a diff object
      const childrenOf = (parent) =>
        remove(unsortedDiffs, (d) => {
          return parent === null
            ? // get root controls
              !d.parentIdRevisionOld && !d.parentIdRevisionNew
            : // get direct children
              (d.parentIdRevisionOld && d.parentIdRevisionOld === get(parent, 'controlRevisionOld.id')) ||
                (d.parentIdRevisionNew && d.parentIdRevisionNew === get(parent, 'controlRevisionNew.id'));
        });
      const getSortKey = (diff) =>
        isNumber(diff.childIndexRevisionNew) ? diff.childIndexRevisionNew : diff.childIndexRevisionOld - 0.5;
      const convert = (diffs, parentIdxPath = []) => {
        // sort to make the order similart to the original
        return sortBy(diffs, getSortKey).map((controlDiff) => {
          const control = controlDiff.controlRevisionNew || controlDiff.controlRevisionOld;
          const idx = controlDiff.controlRevisionNew
            ? controlDiff.childIndexRevisionNew
            : controlDiff.childIndexRevisionOld;
          const idxPath = [...parentIdxPath, idx + 1];
          return {
            name: control.name,
            label: control.label,
            controlType: control.type,
            color: this.colors[controlDiff.changeType],
            hasBreakingChange: controlDiff.hasBreakingChange,
            hasLocalChange: controlDiff.hasLocalChange,
            changeType: controlDiff.changeType,
            changeList: this.getControlChangeList(controlDiff),
            indexPath: idxPath.join('.'),
            children: convert(childrenOf(controlDiff), idxPath),
            pathLocalRevision: controlDiff.pathLocalRevision,
          };
        });
      };
      return convert(childrenOf(null));
    },
    diffInfoTreeWithoutUnchangeds() {
      const filterUnchangeds = (diffInfoTree) => {
        return diffInfoTree
          .map((changeItem) => {
            const children = filterUnchangeds(changeItem.children);
            if (changeItem.changeType !== changeType.UNCHANGED || children.length > 0) {
              return {
                ...changeItem,
                children,
              };
            }
            return null;
          })
          .filter((c) => c !== null);
      };
      return filterUnchangeds(this.diffInfoTree);
    },
    changeSummaryList() {
      let changed = 0;
      let removed = 0;
      let added = 0;
      for (const diffItem of this.diff) {
        switch (diffItem.changeType) {
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
        info(changed, this.colors.changed, 'mdi-book-edit', `${changed} changed`),
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
    getControlChangeList(controlDiff) {
      if (!controlDiff || !controlDiff.diff) {
        return [];
      }
      return Object.entries(controlDiff.diff)
        .map(([key, change]) => {
          if (change.changeType !== changeType.UNCHANGED) {
            return {
              key,
              localValue: change.localValue ? JSON.stringify(change.localValue) : undefined,
              oldValue: JSON.stringify(change.oldValue),
              newValue: JSON.stringify(change.newValue),
            };
          }
          return null;
        })
        .filter((c) => c !== null);
    },
    discardChanged({ discardLocalChange, pathLocalRevision }) {
      if (discardLocalChange) {
        this.localChangesToDiscard.push(pathLocalRevision);
      } else {
        //remote the change from the discard list
        this.localChangesToDiscard = this.localChangesToDiscard.filter((e) => e !== pathLocalRevision);
      }
      this.$emit('discard-local-changes-changed', this.localChangesToDiscard);
    },
  },
};
</script>
