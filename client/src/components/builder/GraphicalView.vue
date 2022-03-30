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
    @update="updateHandler"
    draggable=".draggable-item"
    :group="draggableGroup"
  >
    <v-card
      v-for="(el, idx) in controls"
      class="control-item mb-2"
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
          <div>
            <v-btn icon v-if="areActionsVisible(el) && !el.libraryId" @click.stop="duplicateControl(el)">
              <v-icon color="grey lighten-1">mdi-content-copy</v-icon>
            </v-btn>
            <v-btn
              icon
              v-if="areActionsVisible(el) && el.isLibraryRoot && !el.libraryIsInherited"
              @click.stop="openLibrary(el.libraryId)"
            >
              <v-icon color="grey lighten-1">mdi-library</v-icon>
            </v-btn>
            <v-chip
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
              <v-icon
                v-if="availableLibraryUpdates[el.libraryId] > el.libraryVersion"
                @click.stop="updateLibrary(el)"
                left
              >
                mdi-refresh
              </v-icon>
              Version {{ el.libraryVersion }}
            </v-chip>
            <v-btn
              icon
              v-if="areActionsVisible(el) && (!el.libraryId || (el.isLibraryRoot && !el.libraryIsInherited))"
              @click.stop="() => showDeleteModal(idx)"
            >
              <v-icon :color="availableLibraryUpdates[el.libraryId] === null ? 'error' : 'grey lighten-1'"
                >mdi-delete
              </v-icon>
            </v-btn>
            <v-btn text x-small v-if="el.options.hidden" @click.stop="el.options.hidden = false" color="grey lighten-1">
              unhide
            </v-btn>
          </div>
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
        :readOnly="readOnly"
        @control-selected="$emit('control-selected', $event)"
        @duplicate-control="$emit('duplicate-control', $event)"
        @open-library="$emit('open-library', $event)"
        @update-library-questions="$emit('update-library-questions', $event)"
        :index="createIndex(index, idx + 1)"
        :data-control-type="el.type"
      />

      <nested-draggable
        v-if="el.type == 'page' && !el.options.hidden"
        :class="[
          { 'drop-area-border': el.children.length === 0, 'drop-area': 1 },
          { 'draggable-item': !el.libraryId || (el.isLibraryRoot && !el.libraryIsInherited) },
        ]"
        :selected="selected"
        :controls="el.children"
        :readOnly="readOnly"
        @control-selected="$emit('control-selected', $event)"
        @duplicate-control="$emit('duplicate-control', $event)"
        @open-library="$emit('open-library', $event)"
        @update-library-questions="$emit('update-library-questions', $event)"
        :index="createIndex(index, idx + 1)"
        :data-control-type="el.type"
      />

      <v-dialog v-if="deleteQuestionModalIsVisible" v-model="deleteQuestionModalIsVisible" max-width="290">
        <v-card class="">
          <v-card-title> Delete Question </v-card-title>
          <v-card-text class="mt-4"> Are you sure you want to remove this question? </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn text @click.stop="deleteQuestionModalIsVisible = false"> Cancel </v-btn>
            <v-btn text color="red" @click.stop="handleConfirmDelete"> Remove </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <update-library-dialog
        v-if="updateLibraryDialogIsVisible"
        v-model="updateLibraryDialogIsVisible"
        :from-library-control="updateControl"
        :to-survey="updateToLibrary"
        @ok="updateLibraryConfirmed"
        @cancel="updateLibraryCancelled"
      />
    </v-card>
    <v-alert v-model="pageInPageHintIsVisible" color="info lighten-1" bottom :timeout="-1">
      <div class="d-flex align-center">
        <v-icon class="mr-1">mdi-information</v-icon>
        Pages cannot be nested inside other Pages
      </div>
    </v-alert>
  </draggable>
  <div v-else>
    <v-card class="text--secondary">
      <v-card-title>Empty survey</v-card-title>
      <v-card-text v-if="!readOnly">
        <div class="text--primary">You can add questions by clicking the <strong>plus icon</strong> below.</div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import draggable from 'vuedraggable';
import { cloneDeep } from 'lodash';
import ObjectID from 'bson-objectid';
import { availableControls } from '@/utils/surveyConfig';
import * as utils from '@/utils/surveys';
import api from '@/services/api.service';
import UpdateLibraryDialog from '@/components/survey/library/UpdateLibraryDialog';
import ControlCardHeader from './ControlCardHeader';

export default {
  name: 'nested-draggable',
  components: {
    UpdateLibraryDialog,
    draggable,
    ControlCardHeader,
  },
  data() {
    return {
      drag: false,
      deleteQuestionModalIsVisible: false,
      deleteQuestionIndex: null,
      updateLibraryDialogIsVisible: false,
      updateToLibrary: null,
      updateControl: null,
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
          if (el.dataset.controlType === 'page' && to.el.dataset.controlType === 'page') {
            return false;
          }
          return true;
        },
      },
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
      this.$emit('control-selected', null);
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
    openLibrary(libraryId) {
      this.$emit('open-library', libraryId);
    },
    async updateLibrary(control) {
      this.updateControl = control;
      const { data } = await api.get(`/surveys/${control.libraryId}`);
      this.updateToLibrary = data;
      this.updateLibraryDialogIsVisible = true;
    },
    updateLibraryConfirmed() {
      this.updateToLibrary = null;
      this.updateLibraryDialogIsVisible = false;
      this.$emit('update-library-questions', this.updateControl);
      this.updateControl = null;
    },
    updateLibraryCancelled() {
      this.updateToLibrary = null;
      this.updateLibraryDialogIsVisible = false;
      this.updateControl = null;
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
    // console.log(Date.now());
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
</style>
