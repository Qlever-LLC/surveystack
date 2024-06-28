<template>
  <div>
    <a-dialog v-model="editorDialog">
      <app-ontology-list-editor
        :resources="resources"
        :resource="ontology"
        :disabled="ontology && !!ontology.libraryId"
        @change="setResource"
        @delete="removeResource"
        @close-dialog="editorDialog = false" />
    </a-dialog>

    <a-card class="d-flex flex-column">
      <a-card-title class="d-block">
        <div class="d-flex justify-space-between align-center">
          <div class="text-grey-darken-2">Matrix Column Editor</div>
          <div class="d-flex align-center ml-auto mr-2">
            <a-btn color="primary" @click="addColumn"> <a-icon left>mdi-plus</a-icon>Add Column </a-btn>
          </div>
          <div class="d-flex align-center"></div>
        </div>
      </a-card-title>

      <a-card-text class="pt-0">
        <div class="d-flex justify-start"></div>
        <div>
          <VueDraggable
            class="d-flex flex-row pa-2 px-4"
            style="overflow: auto; max-height: 75vh"
            v-model="columns"
            group="columns"
            @start="drag = true"
            @end="drag = false"
            draggable=".draggable-column"
            handle=".draggable-handle">
            <div class="draggable-column" v-for="(item, i) in columns" :key="i">
              <!-- vertical bar indicating which columns are locked to the left -->
              <a-card
                v-if="item.isFixedUntilMarker"
                width="26px"
                height="100%"
                class="draggable-handle mx-1 py-3 d-flex flex-column justify-space-around align-center"
                elevation="3">
                <a-divider vertical class="lock-line-decor" />
                <a-icon class="my-1">mdi-arrow-horizontal-lock</a-icon>
                <a-divider vertical class="lock-line-decor" />
                <a-tooltip top open-delay="500" activator="parent"
                  >Columns to the left of this line will always be visible</a-tooltip
                >
              </a-card>

              <div v-else>
                <a-card width="16rem" min-width="16rem" class="mx-1" elevation="3">
                  <div class="draggable-handle d-flex pa-2">
                    <a-btn icon small @click="moveItemLeft(i)" :disabled="i === 0" tabindex="-1">
                      <a-icon>mdi-arrow-left</a-icon>
                    </a-btn>
                    <a-btn
                      icon
                      class="ml-1"
                      small
                      @click="moveItemRight(i)"
                      :disabled="i === columns.length - 1"
                      tabindex="-1">
                      <a-icon>mdi-arrow-right</a-icon>
                    </a-btn>
                    <a-spacer />
                    <a-btn icon @click="deleteColumn(i)" tabindex="-1" small>
                      <a-icon>mdi-trash-can-outline</a-icon>
                    </a-btn>
                  </div>
                  <a-card-text>
                    <a-text-field v-model="item.label" label="Label" style="font-size: 1.3rem" dense />
                    <a-text-field v-model="item.value" label="Value" dense />
                    <a-select
                      label="Type"
                      :modelValue="item.type"
                      @update:modelValue="(type) => onChanged(item, { type, defaultValue: null })"
                      :items="$options.MATRIX_COLUMN_TYPES"
                      item-title="text"
                      item-value="value"
                      dense />

                    <!-- DEFAULT VALUE --->
                    <div v-if="item.type === 'dropdown'" class="d-flex flex-column">
                      <div class="d-flex flex-row flex-wrap">
                        <a-select
                          v-model="item.resource"
                          @update:modelValue="(resource) => onChanged(item, { resource, defaultValue: null })"
                          :items="resourceSelectItems"
                          item-title="text"
                          item-value="value"
                          label="Resource"
                          hide-details
                          dense
                          style="max-width: 10rem" />
                        <a-btn
                          @click="createOntology(i)"
                          x-small
                          icon
                          :color="!item.resource ? 'primary' : ''"
                          class="ml-auto">
                          <a-icon>mdi-plus</a-icon>
                        </a-btn>
                        <a-btn @click="openOntologyEditor(item.resource)" x-small :disabled="!item.resource" icon>
                          <a-icon>mdi-pencil</a-icon>
                        </a-btn>
                      </div>
                      <ontology
                        v-model="item.defaultValue"
                        :multiple="item.multiple"
                        :customAnswer="item.custom"
                        :source="item.resource"
                        :resources="resources"
                        dense
                        class="mt-5" />
                    </div>
                    <a-text-field
                      v-else-if="item.type === 'text'"
                      v-model="item.defaultValue"
                      @blur="() => handleDefaultValueTrim(i)"
                      label="Default value"
                      dense
                      hide-details="auto" />
                    <a-text-field
                      v-else-if="item.type === 'number'"
                      type="number"
                      v-model="item.defaultValue"
                      @blur="() => handleDefaultValueTrimNumber(i)"
                      label="Default value"
                      dense
                      hide-details="auto"
                      :rules="[isValidNumber]"
                      clearable
                      @click:clear="setToNull" />
                    <div v-else-if="item.type === 'date'">
                      <date v-model="item.defaultValue" @blur="handleDefaultValueTrim(i)" type="date" dense />
                      <date
                        label="Start Year"
                        v-model="item.startYear"
                        @update:modelValue="$forceUpdate()"
                        type="date-year" />
                      <a-select
                        label="Start Month"
                        v-model="item.startMonth"
                        :items="monthsList"
                        clearable
                        hide-details />
                    </div>
                    <div v-else-if="item.type == 'farmos_uuid'" class="d-flex flex-column">
                      <a-select
                        dense
                        v-model="item.options.farmOsType"
                        :items="item.options.farmOsTypes"
                        label="FarmOS Type"
                        hide-details
                        style="max-width: 10rem" />
                    </div>

                    <div class="mt-5"></div>

                    <!-- MULTIPLE -->
                    <a-checkbox
                      v-if="item.type === 'dropdown'"
                      v-model="item.multiple"
                      label="Multi-select"
                      hide-details
                      color="grey-darken-1"
                      class="align-center align-self-start" />

                    <!-- ALLOW CUSTOM ANSWER -->
                    <a-checkbox
                      v-if="item.type === 'dropdown'"
                      v-model="item.custom"
                      label="Allow custom answer"
                      hide-details
                      color="grey-darken-1"
                      class="align-center align-self-start">
                      <template v-slot:helper-text>
                        Allows the user to input answers that do not exist within the provided items.
                      </template>
                    </a-checkbox>

                    <!-- REQUIRED -->
                    <a-checkbox
                      v-model="item.required"
                      @update:modelValue="$event && $emit('set-control-required')"
                      label="Required"
                      helper-text="Make this a required field"
                      hide-details
                      class="align-center align-self-start"
                      color="grey-darken-1" />

                    <!-- REDACTED -->
                    <a-checkbox
                      v-model="item.redacted"
                      label="Private"
                      helper-text="Visible to submitter and admins only"
                      class="align-center align-self-start"
                      color="grey-darken-1" />

                    <!-- QSL: ALLOW HIDE / HIDDEN -->
                    <a-checkbox
                      v-if="allowSetAllowHide"
                      v-model="item.allowHide"
                      label="Allow hide"
                      class="align-center align-self-start"
                      helper-text="Allow users of this question set to hide this column"
                      color="grey-darken-1" />
                    <a-checkbox
                      v-if="!allowSetAllowHide && item.allowHide"
                      v-model="item.hidden"
                      label="Hidden"
                      class="align-center align-self-start"
                      helper-text="Submitters can not see this column. This option is intentionally allowed by the question set designer"
                      color="grey-darken-1" />

                    <!-- FARMOS FIELD -->
                    <a-checkbox
                      v-if="item.type == 'farmos_field' || item.type == 'farmos_planting'"
                      v-model="item.multiple"
                      label="Multi-select"
                      class="align-center align-self-start"
                      color="grey-darken-1" />

                    <h4 class="mt-6 mb-4">Display Options</h4>
                    <a-text-field
                      type="number"
                      v-model.number="item.scaleWidth"
                      label="Scale minimum width %"
                      dense
                      autocomplete="off"
                      hint="Default 100"
                      persistent-hint />
                  </a-card-text>
                </a-card>
              </div>
            </div>

            <a-btn @click="addColumn" class="align-self-center mx-4 my-6" fab small color="primary">
              <a-icon x-large>mdi-plus</a-icon>
            </a-btn>
          </VueDraggable>
        </div>
      </a-card-text>
      <a-spacer />
      <a-card-actions class="select-table-actions d-flex justify-end mr-3 align-start">
        <a-btn variant="text" class="ml-4" @click="() => $emit('close-dialog')">Close</a-btn>
      </a-card-actions>
    </a-card>
  </div>
</template>

<script>
import ObjectId from 'bson-objectid';
import { VueDraggable } from 'vue-draggable-plus';
import AppOntologyListEditor from '@/components/builder/OntologyListEditor.vue';
import Ontology from '@/components/builder/Ontology.vue';
import Date from '@/components/builder/Date.vue';

import { resourceLocations, resourceTypes } from '@/utils/resources';
import { getValueOrNull } from '@/utils/surveyStack';

const MATRIX_COLUMN_TYPES = [
  { text: 'Dropdown', value: 'dropdown' },
  { text: 'Text', value: 'text' },
  { text: 'Text and QR-Code', value: 'qrcode' },
  { text: 'Number', value: 'number' },
  { text: 'Date', value: 'date' },
  { text: 'Farmos Field', value: 'farmos_field' },
  { text: 'Farmos Planting', value: 'farmos_planting' },
  { text: 'Farmos ID', value: 'farmos_uuid' },
];

const createOptions = (src) => {
  if (src.type === 'farmos_uuid') {
    // sync with surveyConfig.js
    src.options.farmOsType = 'field';
    src.options.farmOsTypes = ['field', 'planting'];
  }
  return src;
};

export default {
  components: {
    AppOntologyListEditor,
    VueDraggable,
    Ontology,
    Date,
  },
  props: {
    modelValue: {
      type: Object,
      required: true,
      default: () => ({ content: [], config: { addRowLabel: 'Add row', fixedColumns: 1 } }),
    },
    resources: {
      type: Array,
      required: true,
      default: () => [],
    },
    allowSetAllowHide: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['set-survey-resources', 'set-control-required', 'close-dialog'],
  data() {
    return {
      deleteDialogIsVisible: false,
      editorDialog: false,
      editOntologyId: null,
      monthsList: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
    };
  },
  computed: {
    resourceSelectItems() {
      return this.resources
        .filter((resource) => resource.type === resourceTypes.ONTOLOGY_LIST)
        .map((resource) => ({ text: resource.label, value: resource.id }));
    },
    ontology() {
      return this.resources.find((resource) => resource.id === this.editOntologyId);
    },
    // get/set the position of the columns and the "lock-to-left" marker
    columns: {
      get() {
        const columns = [...this.modelValue.content];
        const fixedColumns = this.modelValue.config.fixedColumns || 0;
        columns.splice(fixedColumns, 0, { isFixedUntilMarker: true });
        return columns;
      },
      set(columns) {
        //TODO refactor illegal prop mutation
        this.modelValue.config.fixedColumns = Math.max(
          0,
          columns.findIndex((c) => c.isFixedUntilMarker === true)
        );
        this.modelValue.content = columns.filter((c) => c.isFixedUntilMarker !== true);
      },
    },
  },
  methods: {
    removeResource(id) {
      const index = this.resources.findIndex((r) => r.id === id);
      const newResources = [...this.resources.slice(0, index), ...this.resources.slice(index + 1)];
      this.$emit('set-survey-resources', newResources);
    },
    setResource(resource) {
      const index = this.resources.findIndex((r) => r.id === resource.id);
      const newResources = [...this.resources.slice(0, index), resource, ...this.resources.slice(index + 1)];
      this.$emit('set-survey-resources', newResources);
    },
    createOntology(column) {
      const id = new ObjectId().toString();
      this.columns[column].resource = id;
      this.$emit('set-survey-resources', [
        ...this.resources,
        {
          label: `Ontology List ${this.resources.length + 1}`,
          name: `ontology_list_${this.resources.length + 1}`,
          id,
          type: resourceTypes.ONTOLOGY_LIST,
          location: resourceLocations.EMBEDDED,
          content: [],
        },
      ]);
      this.openOntologyEditor(id);
    },
    openOntologyEditor(id) {
      this.editOntologyId = id;
      this.editorDialog = true;
    },
    moveItemLeft(index) {
      if (index === 0) {
        return;
      }
      this.swapColumns(index - 1, index);
    },
    moveItemRight(index) {
      if (index >= this.columns.length - 1) {
        return;
      }
      this.swapColumns(index + 1, index);
    },
    swapColumns(idx1, idx2) {
      const columns = [...this.columns];
      [columns[idx1], columns[idx2]] = [columns[idx2], columns[idx1]];
      this.columns = columns;
    },

    createEmptyColumn() {
      return createOptions({
        label: '',
        value: '',
        tags: '',
        type: '',
        options: {},
        resource: '',
        multiple: false,
        custom: false,
        required: false,
        redacted: false,
        scaleWidth: 100,
      });
    },
    deleteColumn(index) {
      const columns = [...this.columns];
      columns.splice(index, 1);
      this.columns = columns;
    },
    addColumn() {
      //TODO refactor illegal prop mutation
      this.modelValue.content = [...this.modelValue.content, this.createEmptyColumn()];
    },
    onChanged(item, value) {
      Object.assign(item, value);
      item = createOptions(item);
    },
    handleDefaultValueTrim(i) {
      const value = this.columns[i].defaultValue;
      this.columns[i].defaultValue = getValueOrNull(Array.isArray(value) ? value.map(getValueOrNull) : value);
    },
    handleDefaultValueTrimNumber(i) {
      const val = this.columns[i].defaultValue;
      if (val === '0') {
        //the number 0 is to be considered separately because Number(0) is also equal to false
        const value = String(Number(this.columns[i].defaultValue));
        this.columns[i].defaultValue = getValueOrNull(Array.isArray(value) ? value.map(getValueOrNull) : value);
      } else if (Number(val)) {
        const value = Number(this.columns[i].defaultValue);
        this.columns[i].defaultValue = getValueOrNull(Array.isArray(value) ? value.map(getValueOrNull) : value);
      } else {
        this.columns[i].defaultValue = null;
      }
    },
    isValidNumber(val) {
      return isNaN(Number(val)) ? 'Please enter a number' : true;
    },
    setToNull(e) {
      e.target.value = null;
    },
  },
  MATRIX_COLUMN_TYPES,
};
</script>

<style scoped lang="scss">
.lock-line-decor {
  min-height: initial;
  flex-grow: 1;
  align-self: center;
}

:deep(.v-input--checkbox) {
  width: fit-content;
}
</style>
