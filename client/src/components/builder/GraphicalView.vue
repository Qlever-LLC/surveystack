<template>
  <!--
    WARNING: this component renders recursively, be careful!
    vuedraggable props are not exposed via this component's props so recursively rendered children (via <nested-draggable />) can't set these props
  -->
  <VueDraggable
    v-if="state.draggableControls?.length !== 0 || index.length !== 0"
    class="draggable"
    :class="{ cursorPointer: readOnly }"
    :style="state.scaleStyles"
    :disabled="readOnly"
    tag="div"
    v-model="state.draggableControls"
    :invertSwap="true"
    @start="startHandler"
    @end="endHandler"
    @update="onUpdate"
    draggable=".draggable-item"
    :group="state.draggableGroup"
    ref="rootDraggable">
    <a-card
      v-for="(el, idx) in state.draggableControls"
      class="control-item py-3"
      :class="[
        { 'control-item-selected': el === selected },
        { 'library-border': el.isLibraryRoot && !el.libraryIsInherited },
        { 'control-item-library': el.libraryId },
        { 'draggable-item': !el.libraryId || (el.isLibraryRoot && !el.libraryIsInherited) },
      ]"
      :key="el.id || el._id"
      @mousedown.stop.left="$emit('control-selected', el)"
      :data-testid="`control-card-${el.id}`"
      :data-control-type="el.type"
      :data-control-contains-page="state.descendantHasPage(el)">
      <div
        class="d-flex justify-space-between align-center"
        @mouseover.stop="handleCardHoverChange({ control: el, isHovering: true })"
        @mouseleave.stop="handleCardHoverChange({ control: el, isHovering: false })">
        <control-card-header
          v-if="!el.options.hidden"
          :index="getDisplayIndex(createIndex(index, idx + 1))"
          :title="getDisplay(el)"
          :type="el.type"
          :dataName="el.name" />
        <div class="text-grey-darken-1" v-if="el.options.hidden">
          {{ getDisplayIndex(createIndex(index, idx + 1)) }} &nbsp; {{ getDisplay(el) }}
        </div>
        <div class="context-actions">
          <a-btn icon v-if="areActionsVisible(el) && !el.libraryId" @click.stop="duplicateControl(el)">
            <a-icon color="grey-lighten-1">mdi-content-copy</a-icon>
          </a-btn>
          <a-btn
            icon
            v-if="areActionsVisible(el) && el.isLibraryRoot && !el.libraryIsInherited"
            @mousedown.stop="toggleLibrary(el.libraryId)">
            <a-icon :color="getLibraryIconColor(el.libraryId)">mdi-library</a-icon>
          </a-btn>
          <a-chip
            v-if="areActionsVisible(el) && el.isLibraryRoot && !el.libraryIsInherited"
            class="align-center text-align-center text-center"
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
            ">
            <a-icon
              v-if="availableLibraryUpdates[el.libraryId] > el.libraryVersion"
              @click.stop="$emit('update-library-control', el)"
              left>
              mdi-refresh
            </a-icon>
            Version {{ el.libraryVersion }}
          </a-chip>
          <a-btn
            icon
            v-if="!readOnly && (!el.libraryId || (el.isLibraryRoot && !el.libraryIsInherited))"
            @click.stop="() => showDeleteModal(idx)">
            <a-icon :color="availableLibraryUpdates[el.libraryId] === null ? 'error' : 'grey-lighten-1'">
              mdi-delete
            </a-icon>
          </a-btn>
          <a-btn
            text
            x-small
            v-if="el.options.hidden"
            @click.stop="$emit('unhide-control', el)"
            color="grey-lighten-1"
            style="margin-bottom: -8px">
            unhide
          </a-btn>
          <a-btn
            text
            x-small
            v-if="areActionsVisible(el) && el.libraryId && el.options.allowHide && !el.options.hidden"
            @click.stop="$emit('hide-control', el)"
            color="grey-lighten-1"
            class="mb-4">
            hide
          </a-btn>
        </div>
      </div>

      <GraphicalView
        v-if="el.type == 'group' && !el.options.hidden"
        :class="[
          { 'drop-area-border': el.children.length === 0, 'drop-area': 1 },
          { 'draggable-item': !el.libraryId || (el.isLibraryRoot && !el.libraryIsInherited) },
        ]"
        :selected="selected"
        v-model="el.children"
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
        :data-control-contains-page="state.descendantHasPage(el)" />

      <GraphicalView
        v-if="el.type == 'page' && !el.options.hidden"
        :class="[
          { 'drop-area-border': el.children.length === 0, 'drop-area': 1 },
          { 'draggable-item': !el.libraryId || (el.isLibraryRoot && !el.libraryIsInherited) },
        ]"
        :selected="selected"
        v-model="el.children"
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
        :data-control-contains-page="state.descendantHasPage(el)"
        :index="createIndex(index, idx + 1)" />
    </a-card>

    <a-dialog v-if="state.deleteQuestionModalIsVisible" v-model="state.deleteQuestionModalIsVisible" max-width="290">
      <a-card>
        <a-card-title> Delete Question</a-card-title>
        <a-card-text class="mt-4"> Are you sure you want to remove this question?</a-card-text>
        <a-card-actions>
          <a-spacer />
          <a-btn variant="text" @click.stop="state.deleteQuestionModalIsVisible = false"> Cancel</a-btn>
          <a-btn variant="text" color="red" @click.stop="handleConfirmDelete"> Remove</a-btn>
        </a-card-actions>
      </a-card>
    </a-dialog>
  </VueDraggable>
  <div v-else>
    <a-card class="text-secondary">
      <a-card-title>Empty survey</a-card-title>
      <a-card-text v-if="!readOnly">
        <div class="text-primary">
          You can add questions by clicking the <strong>plus icon</strong>
          below.
        </div>
      </a-card-text>
    </a-card>
  </div>
</template>

<script setup>
import { VueDraggable } from 'vue-draggable-plus';
import { cloneDeep } from 'lodash';
import ObjectID from 'bson-objectid';
import { availableControls } from '@/utils/surveyConfig';
import * as utils from '@/utils/surveys';
import ControlCardHeader from './ControlCardHeader';
import { ref, reactive, onMounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    required: false,
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
});

const emit = defineEmits([
  'update:modelValue',
  'control-selected',
  'control-removed',
  'duplicate-control',
  'open-library',
  'update-library-control',
  'hide-control',
  'unhide-control',
]);

const rootDraggable = ref(null);

const state = reactive({
  scaleStyles: {},
  draggableControls: props.modelValue,
  drag: false,
  deleteQuestionModalIsVisible: false,
  deleteQuestionIndex: null,
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
});

onMounted(() => {
  if (rootDraggable.value.$el) {
    const { width, height } = rootDraggable.value.$el.getBoundingClientRect();
    if (props.scale !== 1.0)
      state.scaleStyles = {
        transform: `scale(${props.scale})`,
        transformOrigin: 'top left',
        marginRight: `-${width * (1.0 - props.scale)}px`,
        marginBottom: `-${height * (1.0 - props.scale)}px`,
      };
  }
});

function getDisplayIndex(value) {
  return value.join('.');
}

function onUpdate() {
  emit('update:modelValue', state.draggableControls);
}
function startHandler(ev) {
  if (ev.item.dataset.controlType === 'page') {
    state.pageInPageHintIsVisible = true;
  }
  state.drag = true;
}
function endHandler() {
  state.drag = false;
  state.pageInPageHintIsVisible = false;
}
function getIconForType(type) {
  const control = availableControls.find((c) => c.type === type);
  return control && control.icon;
}
function getDisplay(control) {
  return control.label || control.hint || control.type;
}
function showDeleteModal(index) {
  state.deleteQuestionModalIsVisible = true;
  state.deleteQuestionIndex = index;
}
function handleConfirmDelete() {
  removeAt(state.deleteQuestionIndex);
  state.deleteQuestionModalIsVisible = false;
}
function removeAt(idx) {
  state.draggableControls.splice(idx, 1);
  emit('control-removed');
}
function createIndex(current, idx) {
  const newIndex = [...current];
  newIndex.push(idx);
  return newIndex;
}
function duplicateControl(el) {
  const copy = {
    ...cloneDeep(el),
    name: `${el.name}_copy`,
    label: `${el.label} copy`,
    id: new ObjectID().toString(),
  };

  utils.changeRecursive(copy, (control) => {
    control.id = new ObjectID().toString();
  });

  emit('duplicate-control', copy);
}
function toggleLibrary(libraryId) {
  emit('toggle-library', libraryId);
}
function getLibraryIconColor(libraryId) {
  return `${props.libraryId && props.libraryId === libraryId ? 'green-lighten-1' : 'grey-lighten-1'}`;
}
function handleCardHoverChange({ control, isHovering }) {
  if (isHovering) {
    state.hoveredControl = control;
  } else if (state.hoveredControl === control) {
    state.hoveredControl = null;
  }
}
function areActionsVisible(control) {
  return !props.readOnly && state.hoveredControl === control;
}
</script>
<style scoped lang="scss">
.cursorPointer {
  cursor: pointer !important;
}
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
  margin-bottom: 8px;
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
  border-left: 2px solid rgb(var(--v-theme-primary));
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
  background-color: rgb(var(--v-theme-info));
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
  border-bottom: 7px solid rgb(var(--v-theme-info));
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
