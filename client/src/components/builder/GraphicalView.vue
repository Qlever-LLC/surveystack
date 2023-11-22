<template>
  <!--
    WARNING: this component renders recursively, be careful!
    vuedraggable props are not exposed via this component's props so recursively rendered children (via <nested-draggable />) can't set these props
  -->
  <draggable
    v-if="controls.length !== 0 || index.length !== 0"
    class="draggable"
    :class="controls"
    :style="scaleStyles"
    :disabled="readOnly"
    tag="div"
    :list="controls"
    :invertSwap="true"
    @start="startHandler"
    @end="endHandler"
    draggable=".draggable-item"
    :group="draggableGroup"
  >
    <!-- TODO in Vue3 remove .native -->
    <a-card
      v-for="(el, idx) in controls"
      class="control-item mb-2"
      :class="[
        { 'control-item-selected': el === selected },
        { 'library-border': el.isLibraryRoot && !el.libraryIsInherited },
        { 'control-item-library': el.libraryId },
        { 'draggable-item': !el.libraryId || (el.isLibraryRoot && !el.libraryIsInherited) },
      ]"
      :key="el.id || el._id"
      @mousedown.native.stop.left="$emit('control-selected', el)"
      :data-testid="`control-card-${el.id}`"
      :data-control-type="el.type"
      :data-control-contains-page="descendantHasPage(el)"
    >
      <div
        class="d-flex justify-space-between align-center"
        @mouseover.stop="handleCardHoverChange({ control: el, isHovering: true })"
        @mouseleave.stop="handleCardHoverChange({ control: el, isHovering: false })"
      >
        <control-card-header
          v-if="!el.options.hidden"
          :index="createIndex(index, idx + 1) | displayIndex"
          :title="getDisplay(el)"
          :type="el.type"
          :dataName="el.name"
        />
        <div class="grey--text text--darken-1" v-if="el.options.hidden">
          {{ createIndex(index, idx + 1) | displayIndex }} &nbsp; {{ getDisplay(el) }}
        </div>
        <div class="mb-2 context-actions">
          <v-btn icon v-if="areActionsVisible(el) && !el.libraryId" @click.stop="duplicateControl(el)">
            <a-icon color="grey lighten-1">mdi-content-copy</a-icon>
          </v-btn>
          <v-btn
            icon
            v-if="areActionsVisible(el) && el.isLibraryRoot && !el.libraryIsInherited"
            @mousedown.stop="toggleLibrary(el.libraryId)"
          >
            <a-icon :color="getLibraryIconColor(el.libraryId)">mdi-library</a-icon>
          </v-btn>
          <a-chip
            v-if="areActionsVisible(el) && el.isLibraryRoot && !el.libraryIsInherited"
            class="align-center text-align-center text-center"
            dark
            small
            :color="
              availableLibraryUpdates[el.libraryId] === null
                ? 'error'
                : availableLibraryUpdates[el.libraryId] > el.libraryVersion
                ? 'warning'
                : 'grey'
            "
            :title="
              availableLibraryUpdates[el.libraryId] === null
                ? 'question set has been deleted in the library'
                : availableLibraryUpdates[el.libraryId]
                ? 'new version ' + availableLibraryUpdates[el.libraryId] + ' available'
                : 'newest available version'
            "
          >
            <a-icon
              v-if="availableLibraryUpdates[el.libraryId] > el.libraryVersion"
              @click.stop="$emit('update-library-control', el)"
              left
            >
              mdi-refresh
            </a-icon>
            Version {{ el.libraryVersion }}
          </a-chip>
          <v-btn
            icon
            v-if="!el.libraryId || (el.isLibraryRoot && !el.libraryIsInherited)"
            @click.stop="() => showDeleteModal(idx)"
          >
            <a-icon :color="availableLibraryUpdates[el.libraryId] === null ? 'error' : 'grey lighten-1'">
              mdi-delete
            </a-icon>
          </v-btn>
          <v-btn
            text
            x-small
            v-if="el.options.hidden"
            @click.stop="$emit('unhide-control', el)"
            color="grey lighten-1"
            style="margin-bottom: -8px"
          >
            unhide
          </v-btn>
          <v-btn
            text
            x-small
            v-if="areActionsVisible(el) && el.libraryId && el.options.allowHide && !el.options.hidden"
            @click.stop="$emit('hide-control', el)"
            color="grey lighten-1"
            class="mb-4"
          >
            hide
          </v-btn>
        </div>
      </div>

      <nested-draggable
        v-if="el.type == 'group' && !el.options.hidden"
        :class="[
          { 'drop-area-border': el.children.length === 0, 'drop-area': 1 },
          { 'draggable-item': !el.libraryId || (el.isLibraryRoot && !el.libraryIsInherited) },
        ]"
        :selected="selected"
        :controls="el.children"
        :availableLibraryUpdates="availableLibraryUpdates"
        :readOnly="readOnly"
        @control-selected="$emit('control-selected', $event)"
        @control-removed="$emit('control-removed', $event)"
        @duplicate-control="$emit('duplicate-control', $event)"
        @open-library="$emit('open-library', $event)"
        @update-library-control="$emit('update-library-control', $event)"
        @hide-control="$emit('hide-control', $event)"
        @unhide-control="$emit('unhide-control', $event)"
        :index="createIndex(index, idx + 1)"
        :data-control-type="el.type"
        :data-control-contains-page="descendantHasPage(el)"
      />

      <nested-draggable
        v-if="el.type == 'page' && !el.options.hidden"
        :class="[
          { 'drop-area-border': el.children.length === 0, 'drop-area': 1 },
          { 'draggable-item': !el.libraryId || (el.isLibraryRoot && !el.libraryIsInherited) },
        ]"
        :selected="selected"
        :controls="el.children"
        :availableLibraryUpdates="availableLibraryUpdates"
        :readOnly="readOnly"
        @control-selected="$emit('control-selected', $event)"
        @control-removed="$emit('control-removed', $event)"
        @duplicate-control="$emit('duplicate-control', $event)"
        @open-library="$emit('open-library', $event)"
        @update-library-control="$emit('update-library-control', $event)"
        @hide-control="$emit('hide-control', $event)"
        @unhide-control="$emit('unhide-control', $event)"
        :data-control-type="el.type"
        :data-control-contains-page="descendantHasPage(el)"
        :index="createIndex(index, idx + 1)"
      />
    </a-card>

    <v-dialog v-if="deleteQuestionModalIsVisible" v-model="deleteQuestionModalIsVisible" max-width="290">
      <a-card>
        <a-card-title> Delete Question </a-card-title>
        <a-card-text class="mt-4"> Are you sure you want to remove this question? </a-card-text>
        <a-card-actions>
          <a-spacer />
          <v-btn text @click.stop="deleteQuestionModalIsVisible = false"> Cancel </v-btn>
          <v-btn text color="red" @click.stop="handleConfirmDelete"> Remove </v-btn>
        </a-card-actions>
      </a-card>
    </v-dialog>
  </draggable>
  <div v-else>
    <a-card class="text--secondary">
      <a-card-title>Empty survey</a-card-title>
      <a-card-text v-if="!readOnly">
        <div class="text--primary">
          You can add questions by clicking the <strong>plus icon</strong>
          below.
        </div>
      </a-card-text>
    </a-card>
  </div>
</template>

<script>
import draggable from 'vuedraggable';
import { cloneDeep } from 'lodash';
import ObjectID from 'bson-objectid';
import { availableControls } from '@/utils/surveyConfig';
import * as utils from '@/utils/surveys';
import ControlCardHeader from './ControlCardHeader';

export default {
  name: 'nested-draggable',
  components: {
    draggable,
    ControlCardHeader,
  },
  data() {
    return {
      drag: false,
      deleteQuestionModalIsVisible: false,
      deleteQuestionIndex: null,
      scaleStyles: {},
      hoveredControl: null,
      pageInPageHintIsVisible: false,
      draggableGroup: {
        name: 'g1',
        // put ::: String | String[] | (to, from, el, event) => Boolean
        // to: the sortablejs instance which will be `put` into
        // from: the sortablejs instance which will be `put` from
        // el: the active element which is being `put` from `from` into `to`
        // ev: the sortablejs event
        // returns: Boolean value indicating whether `el` should be allowed to be `put` from `from` into `to`
        put(to, _, el) {
          if (el.dataset.controlContainsPage === 'true' && to.el.dataset.controlType === 'page') {
            return false;
          }
          return true;
        },
      },
      descendantHasPage: utils.descendantHasPage,
    };
  },
  props: {
    controls: {
      required: false,
      type: Array,
    },
    selected: Object,
    index: {
      type: Array,
      default() {
        return [];
      },
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    availableLibraryUpdates: {
      required: false,
      type: Object,
      default() {
        return {};
      },
    },
    scale: {
      type: Number,
      default: 1.0,
    },
    libraryId: {
      type: String,
      default: null,
    },
  },
  filters: {
    displayIndex(value) {
      return value.join('.');
    },
  },
  methods: {
    startHandler(ev) {
      if (ev.item.dataset.controlType === 'page') {
        this.pageInPageHintIsVisible = true;
      }
      this.drag = true;
    },
    endHandler() {
      this.drag = false;
      this.pageInPageHintIsVisible = false;
    },
    getIconForType(type) {
      const control = availableControls.find((c) => c.type === type);
      return control && control.icon;
    },
    getDisplay(control) {
      return control.label || control.hint || control.type;
    },
    showDeleteModal(index) {
      this.deleteQuestionModalIsVisible = true;
      this.deleteQuestionIndex = index;
    },
    handleConfirmDelete() {
      this.removeAt(this.deleteQuestionIndex);
      this.deleteQuestionModalIsVisible = false;
    },
    log(name) {
      console.log(name);
    },
    removeAt(idx) {
      this.controls.splice(idx, 1);
      this.$emit('control-removed');
    },
    createIndex(current, idx) {
      const newIndex = [...current];
      newIndex.push(idx);
      return newIndex;
    },
    duplicateControl(el) {
      const copy = {
        ...cloneDeep(el),
        name: `${el.name}_copy`,
        label: `${el.label} copy`,
        id: new ObjectID().toString(),
      };

      utils.changeRecursive(copy, (control) => {
        control.id = new ObjectID().toString();
      });

      this.$emit('duplicate-control', copy);
    },
    toggleLibrary(libraryId) {
      this.$emit('toggle-library', libraryId);
    },
    getLibraryIconColor(libraryId) {
      return `${this.libraryId && this.libraryId === libraryId ? 'green' : 'grey'} lighten-1`;
    },
    handleCardHoverChange({ control, isHovering }) {
      if (isHovering) {
        this.hoveredControl = control;
      } else if (this.hoveredControl === control) {
        this.hoveredControl = null;
      }
    },
    areActionsVisible(control) {
      return !this.readOnly && this.hoveredControl === control;
    },
  },
  mounted() {
    const { width, height } = this.$el.getBoundingClientRect();
    this.scaleStyles =
      this.style === 1.0
        ? {}
        : {
            transform: `scale(${this.scale})`,
            transformOrigin: 'top left',
            marginRight: `-${width * (1.0 - this.scale)}px`,
            marginBottom: `-${height * (1.0 - this.scale)}px`,
          };
  },
};
</script>
<style scoped>
.drop-area {
  min-height: 4rem;
}

.drop-area-border {
  border-radius: 0.25rem;
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.library-border {
  border-width: 2px !important;
  border-color: #4caf50 !important;
  background-color: #b4ecb6 !important;
}

.draggable {
  text-align: left;
  cursor: grab;
  line-height: 1.125rem;
}

.control-item:first-child {
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}

.control-item {
  padding: 0.25rem 1.25rem;
  border: 1px solid rgba(0, 0, 0, 0.125);
  margin-bottom: -1px;
  /* border-left: 2px solid transparent; */
  border-left-width: 2px;
  position: relative;
}

.control-item-library {
  background-color: #d5f5d6 !important;
}

.control-item:hover::before,
.control-item-selected::before {
  position: absolute;
  content: '\F01DD';
  font-family: 'Material Design Icons';
  font-size: 28px;
  color: #bbb;
  top: 50%;
  transform: translateY(-50%);
  left: -5px;
}

.control-item-selected {
  border-left: 2px solid var(--v-primary-base);
}

.context-actions {
  min-width: 108px;
  text-align: right;
}

.sortable-drag[data-control-contains-page='true']::after,
.sortable-drag[data-control-type='page']::after {
  position: absolute;
  content: 'Tip: Pages cannot be nested inside Pages';
  width: 100%;
  left: 0;
  top: 100%;
  margin-top: 13px;
  background-color: var(--v-info-base);
  padding: 0.75rem 1.5rem;
  border-radius: 3px;
}

.control-item.sortable-drag[data-control-contains-page='true']:hover::before,
.control-item-selected.sortable-drag[data-control-contains-page='true']::before,
.control-item.sortable-drag[data-control-type='page']:hover::before,
.control-item-selected.sortable-drag[data-control-type='page']::before {
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 7px solid var(--v-info-base);
  top: 100%;
  margin-top: 3px;
  left: 50%;
  content: '';
  transform: translate(-50%, 50%);
}
</style>

<style>
.flip-list-move {
  transition: transform 0.5s;
}

.no-move {
  transition: transform 0s;
}

.sortable-ghost {
  opacity: 0.2;
}

.sortable-drag[data-control-contains-page='true'],
.sortable-drag[data-control-type='page'] {
  position: relative;
}
</style>
