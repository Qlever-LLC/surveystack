<template>
  <draggable
    v-if="controls.length !== 0 || index.length !== 0"
    class="draggable"
    :class="controls"
    :disabled="readOnly"
    tag="div"
    :list="controls"
    :group="{ name: 'g1' }"
    :invertSwap="true"
    @start="drag = true"
    @end="drag = false"
  >
    <v-card
      v-for="(el, idx) in controls"
      class="control-item mb-2"
      :class="[{'control-item-selected': (el === selected)},{'library-border': el.isLibraryRoot}]"
      :key="el.id || el._id"
      @mousedown.stop.left="$emit('controlSelected', el)"
    >
      <div class="mb-2 d-flex justify-space-between align-center">
        <div>
          <span class="caption grey--text text--darken-1">{{ createIndex(index, idx + 1) | displayIndex}}</span>
          <br />
          <span class="title">
            {{ getDisplay(el) }}
          </span>
          <br />
          <span class="font-weight-light grey--text text--darken-2">
            {{ el.name }}
            : {{ el.type }}
          </span>
        </div>
        <div class="d-flex">
          <v-btn
            icon
            v-if="selected === el && !el.libraryId"
            @click.stop="duplicateControl(el)"
          >
            <v-icon color="grey lighten-1">mdi-content-copy</v-icon>
          </v-btn>
          <v-btn
            icon
            v-if="selected === el && el.isLibraryRoot"
            @click.stop="openLibrary(el.libraryId)"
          >
            <v-icon color="grey lighten-1">mdi-library</v-icon>
          </v-btn>
          <v-btn
            icon
            v-if="selected === el && (!el.libraryId || el.isLibraryRoot)"
            @click.stop="() => showDeleteModal(idx)"
          >
            <v-icon color="grey lighten-1">mdi-delete</v-icon>
          </v-btn>
        </div>
      </div>

      <nested-draggable
        v-if="el.type == 'group'"
        :class="{'drop-area-border': (el.children.length === 0), 'drop-area': 1}"
        :selected="selected"
        :controls="el.children"
        :readOnly="readOnly || !!el.libraryId"
        @controlSelected="$emit('controlSelected', $event)"
        @duplicate-control="$emit('duplicate-control', $event)"
        :index="createIndex(index, idx + 1)"
      />

      <nested-draggable
        v-if="el.type == 'page'"
        :class="{'drop-area-border': (el.children.length === 0), 'drop-area': 1}"
        :selected="selected"
        :controls="el.children"
        :readOnly="readOnly"
        @controlSelected="$emit('controlSelected', $event)"
        @duplicate-control="$emit('duplicate-control', $event)"
        :index="createIndex(index, idx + 1)"
      />

      <v-dialog
        v-if="deleteQuestionModalIsVisible"
        v-model="deleteQuestionModalIsVisible"
        max-width="290"
      >
        <v-card class="">
          <v-card-title>
            Delete Question
          </v-card-title>
          <v-card-text class="mt-4">
            Are you sure you want to remove this question?
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              text
              @click.stop="deleteQuestionModalIsVisible = false"
            >
              Cancel
            </v-btn>
            <v-btn
              text
              color="red"
              @click.stop="handleConfirmDelete"
            >
              Remove
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
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

export default {
  name: 'nested-draggable',
  components: {
    draggable,
  },
  data() {
    return {
      drag: false,
      deleteQuestionModalIsVisible: false,
      deleteQuestionIndex: null,
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
  },
  filters: {
    displayIndex(value) {
      return value.join('.');
    },
  },
  methods: {
    getIconForType(type) {
      const control = availableControls.find(c => c.type === type);
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
      this.$emit('controlSelected', null);
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

      const dive = (control, cb) => {
        cb(control);
        if (!control.children) {
          return;
        }
        control.children.forEach((c) => {
          dive(c, cb);
        });
      };

      dive(copy, (control) => {
        // eslint-disable-next-line no-param-reassign
        control.id = new ObjectID().toString();
      });

      this.$emit('duplicate-control', copy);
    },
    openLibrary(libraryId) {
      this.$emit('open-library', libraryId);
    },
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
  border-width:2px !important;
  border-color:#4CAF50 !important;
}

.draggable {
  text-align: left;
  cursor: grab;
  line-height: 1.125rem;
  background: #fff;
}

.control-item:first-child {
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}

.control-item {
  padding: 0.75rem 1.25rem;
  border: 1px solid rgba(0, 0, 0, 0.125);
  margin-bottom: -1px;
  /* border-left: 2px solid transparent; */
  border-left-width: 2px;
  position: relative;
}

.control-item:hover::before,
.control-item-selected::before {
  position: absolute;
  content: "\F01DD";
  font-family: "Material Design Icons";
  font-size: 28px;
  color: #bbb;
  top: 50%;
  transform: translateY(-50%);
  left: -5px;
}

.control-item-selected {
  border-left: 2px solid var(--v-primary-base);
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
