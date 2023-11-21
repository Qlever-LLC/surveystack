<template>
  <v-card
    class="control-item d-flex flex-column"
    :data-testid="`diff-card-${diffInfo.indexPath}-${diffInfo.changeType}`"
  >
    <button @click="isOpen = !isOpen" :disabled="!haveChangeDetails">
      <v-row>
        <control-card-header
          :index="diffInfo.indexPath"
          :title="diffInfo.label"
          :icon-color="diffInfo.color"
          :type="diffInfo.controlType"
          :dataName="diffInfo.name"
          :chip-label="diffInfo.hasBreakingChange ? 'required change' : diffInfo.changeType"
          :chip-color="diffInfo.color"
          class="ml-3 align-self-center"
        />
        <a-spacer />
        <v-icon v-if="haveChangeDetails" class="mr-5 align-self-center" :class="{ 'mdi-rotate-180': !isOpen }"
          >mdi-chevron-down
        </v-icon>
      </v-row>
    </button>
    <a-table v-if="isOpen" fixed-header dense class="mb-4">
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left"></th>
            <th
              v-if="versionNameLocalRevision"
              class="text-left"
              :class="isLocalVersionSelected ? 'header-selected' : isLocalVersionSelectable ? 'header-selectable' : ''"
              @click="isLocalVersionSelectable && changeDiscarded(false)"
            >
              {{ versionNameLocalRevision }}
              <v-icon v-if="isLocalVersionSelected" style="margin-top: -3px" small title="this version is selected"
                >mdi-checkbox-marked-circle-outline</v-icon
              >
            </th>
            <th class="text-left">{{ versionNameRemoteRevisionOld }}</th>
            <th
              class="text-left"
              :class="
                isNewRemoteVersionSelected ? 'header-selected' : isNewRemoteVersionSelectable ? 'header-selectable' : ''
              "
              @click="isNewRemoteVersionSelectable && changeDiscarded(true)"
            >
              {{ versionNameRemoteRevisionNew }}
              <v-icon v-if="isNewRemoteVersionSelected" style="margin-top: -3px" small title="this version is selected"
                >mdi-checkbox-marked-circle-outline</v-icon
              >
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="change in diffInfo.changeList" :key="change.key">
            <td>{{ change.key }}</td>
            <td
              v-if="versionNameLocalRevision"
              :class="isLocalVersionSelected ? 'cell-selected' : isLocalVersionSelectable ? 'cell-selectable' : ''"
              @click="isLocalVersionSelectable && changeDiscarded(false)"
            >
              {{ change.localValue }}
            </td>
            <td>{{ change.oldValue }}</td>
            <td
              :class="
                isNewRemoteVersionSelected ? 'cell-selected' : isNewRemoteVersionSelectable ? 'cell-selectable' : ''
              "
              @click="isNewRemoteVersionSelectable && changeDiscarded(true)"
            >
              {{ change.newValue }}
            </td>
          </tr>
        </tbody>
      </template>
    </a-table>
    <slot></slot>
    <a-snackbar v-model="showErrorSnackbar" color="orange" :timeout="6000" fixed centered>
      Selecting your Version of this question is not possible because the new
      {{ versionNameRemoteRevisionNew }} contains a required change.
      <template v-slot:action="{ attrs }">
        <v-btn color="white" text v-bind="attrs" @click="showErrorSnackbar = false"> Ok </v-btn>
      </template>
    </a-snackbar>
  </v-card>
</template>

<script>
import ControlCardHeader from '../builder/ControlCardHeader';
import { changeType } from '@/utils/surveyDiff';
import ASnackbar from '@/components/ui/ASnackbar.vue';

export default {
  name: 'survey-diff-card',
  components: {
    ControlCardHeader,
    ASnackbar,
  },
  data() {
    return {
      isOpen: false,
      discardLocalChange: false,
      showErrorSnackbar: false,
    };
  },
  props: {
    diffInfo: {
      type: Object,
      required: true,
    },
    versionNameLocalRevision: {
      type: String,
      required: false,
    },
    versionNameRemoteRevisionOld: {
      type: String,
      required: true,
    },
    versionNameRemoteRevisionNew: {
      type: String,
      required: false,
    },
  },
  emits: ['discard-changed'],
  computed: {
    haveChangeDetails() {
      return this.diffInfo.changeType === changeType.CHANGED || this.diffInfo.hasBreakingChange;
    },
    isLocalVersionSelected() {
      return this.diffInfo.hasLocalChange && !this.discardLocalChange;
    },
    isLocalVersionSelectable() {
      return this.diffInfo.hasLocalChange && this.discardLocalChange;
    },
    isNewRemoteVersionSelected() {
      return this.versionNameLocalRevision && (!this.diffInfo.hasLocalChange || this.discardLocalChange);
    },
    isNewRemoteVersionSelectable() {
      return this.versionNameLocalRevision && !this.isNewRemoteVersionSelected;
    },
  },
  methods: {
    changeDiscarded(discarded) {
      if (!this.versionNameLocalRevision) {
        //no local version displayed, so discarding makes no sense
        return;
      }
      if (this.diffInfo.hasBreakingChange && !discarded) {
        this.showErrorSnackbar = true;
        return;
      }
      this.discardLocalChange = discarded;
      this.$emit('discard-changed', {
        discardLocalChange: this.discardLocalChange,
        pathLocalRevision: this.diffInfo.pathLocalRevision,
      });
    },
  },
  mounted() {
    if (this.diffInfo.hasBreakingChange) {
      this.changeDiscarded(true);
    }
  },
};
</script>

<style scoped lang="scss">
.control-item {
  padding: 0.25rem 1.25rem;
  border: 1px solid rgba(0, 0, 0, 0.125);
  margin-bottom: -1px;
  border-left-width: 2px;
  position: relative;
}

tr:hover {
  background-color: transparent !important;
}

.header-selectable {
  background-color: transparent !important;
  border: 2px solid #ffca28;
  border-bottom: none;
  cursor: pointer;
  //text-decoration: line-through;
  //text-decoration-color: grey;
}

.cell-selectable {
  background-color: transparent !important;
  border: 2px solid #ffca28;
  border-top: none;
  border-bottom: none;
  cursor: pointer;
  //text-decoration: line-through;
  //text-decoration-color: grey;
}

tr:last-child .cell-selectable {
  background-color: transparent !important;
  border: 2px solid #ffca28;
  border-top: none;
  cursor: pointer;
  //text-decoration: line-through;
  //text-decoration-color: grey;
}

.header-selected {
  background-color: #ffecb3 !important;
  border: 2px solid #ffca28;
  border-bottom: none;
}

.cell-selected {
  background-color: #ffecb3 !important;
  border: 2px solid #ffca28;
  border-top: none;
  border-bottom: none;
}

tr:last-child .cell-selected {
  background-color: #ffecb3 !important;
  border: 2px solid #ffca28;
  border-top: none;
}
</style>
