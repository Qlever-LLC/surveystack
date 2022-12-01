<template>
  <div>
    <v-dialog v-model="editorDialog">
      <app-ontology-list-editor
        :resources="resources"
        :resource="ontology"
        :disabled="ontology && !!ontology.libraryId"
        @change="setResource"
        @delete="removeResource"
        @close-dialog="editorDialog = false"
      />
    </v-dialog>

    <v-card class="d-flex flex-column">
      <v-card-title class="d-block">
        <div class="d-flex justify-space-between align-center">
          <div class="grey--text text--darken-2">Matrix Column Editor</div>
          <div class="d-flex align-center ml-auto mr-2">
            <v-btn color="primary" @click="addColumn"> <v-icon left>mdi-plus</v-icon>Add Column </v-btn>
          </div>
          <div class="d-flex align-center"></div>
        </div>
      </v-card-title>

      <v-card-text class="pt-0">
        <div class="d-flex justify-start"></div>
        <div>
          <draggable
            class="d-flex flex-row pa-2 px-4"
            style="overflow-x: auto"
            v-model="columns"
            group="columns"
            @start="drag = true"
            @end="drag = false"
            draggable=".draggable-column"
            handle=".draggable-handle"
          >
            <div class="draggable-column" v-for="(item, i) in columns" :key="i">
              <!-- vertical bar indicating which columns are locked to the left -->
              <v-tooltip v-if="item.isFixedUntilMarker" top open-delay="500">
                <template v-slot:activator="{ on, attrs }">
                  <v-card
                    width="26px"
                    height="100%"
                    class="draggable-handle mx-1 py-3 d-flex flex-column justify-space-around align-center"
                    elevation="3"
                    v-bind="attrs"
                    v-on="on"
                  >
                    <v-divider vertical class="lock-line-decor" />
                    <v-icon class="my-1">mdi-arrow-horizontal-lock</v-icon>
                    <v-divider vertical class="lock-line-decor" />
                  </v-card>
                </template>
                <span>Columns to the left of this line will always be visible</span>
              </v-tooltip>

              <div v-else>
                <v-card width="16rem" min-width="16rem" class="mx-1" elevation="3">
                  <div class="draggable-handle d-flex pa-2">
                    <v-btn icon small @click="moveItemLeft(i)" :disabled="i === 0" tabindex="-1">
                      <v-icon>mdi-arrow-left</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      class="ml-1"
                      small
                      @click="moveItemRight(i)"
                      :disabled="i === columns.length - 1"
                      tabindex="-1"
                    >
                      <v-icon>mdi-arrow-right</v-icon>
                    </v-btn>
                    <v-spacer />
                    <v-btn icon @click="deleteColumn(i)" tabindex="-1" small>
                      <v-icon>mdi-trash-can-outline</v-icon>
                    </v-btn>
                  </div>
                  <v-card-text>
                    <v-text-field v-model="item.label" label="Label" style="font-size: 1.3rem" dense />
                    <v-text-field v-model="item.value" label="Value" dense />
                    <v-select
                      dense
                      v-bind:value="item.type"
                      v-on:input="(type) => onTypeChanged({ ...item, type }, i)"
                      :items="$options.MATRIX_COLUMN_TYPES"
                      label="Type"
                    />
                    <div v-if="item.type === 'dropdown'" class="d-flex flex-column">
                      <div class="d-flex flex-row flex-wrap">
                        <v-select
                          dense
                          v-model="item.resource"
                          :items="resourceSelectItems"
                          label="Resource"
                          hide-details
                          style="max-width: 10rem"
                        />
                        <v-btn
                          @click="createOntology(i)"
                          small
                          icon
                          :color="!item.resource ? 'primary' : ''"
                          class="ml-auto"
                        >
                          <v-icon>mdi-plus</v-icon>
                        </v-btn>
                        <v-btn @click="openOntologyEditor(item.resource)" small :disabled="!item.resource" icon>
                          <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                      </div>
                      <v-checkbox class="mt-2 ml-2" v-model="item.multiple" label="Multi-select" hide-details dense />
                      <v-checkbox
                        class="mt-0 ml-2"
                        v-model="item.custom"
                        label="Allow custom answer"
                        hide-details
                        dense
                      />
                    </div>

                    <div v-if="item.type == 'farmos_uuid'" class="d-flex flex-column">
                      <v-select
                        dense
                        v-model="item.options.farmOsType"
                        :items="item.options.farmOsTypes"
                        label="FarmOS Type"
                        hide-details
                        style="max-width: 10rem"
                      />
                    </div>

                    <v-checkbox
                      v-model="item.required"
                      @change="
                        (v) => {
                          v && $emit('set-control-required');
                        }
                      "
                      label="Required"
                      class="mt-2"
                      hide-details
                    />
                    <v-checkbox
                      v-model="item.redacted"
                      label="Private"
                      class="mt-2"
                      hint="Visible to submitter and admins only"
                      persistent-hint
                    />
                    <v-checkbox
                      v-if="allowSetAllowHide"
                      v-model="item.allowHide"
                      label="Allow hide"
                      class="mt-2"
                      hint="Allow users of this question set to hide this column"
                      persistent-hint
                    />
                    <v-checkbox
                      v-if="!allowSetAllowHide && item.allowHide"
                      v-model="item.hidden"
                      label="Hidden"
                      class="mt-2"
                      hint="Submitters can not see this column. This option is intentionally allowed by the question set designer"
                      persistent-hint
                    />

                    <div
                      v-if="item.type == 'farmos_field' || item.type == 'farmos_planting'"
                      class="d-flex flex-column"
                    >
                      <v-checkbox class="mt-2" v-model="item.multiple" label="Multiselect" hide-details />
                    </div>

                    <h4 class="mt-6 mb-4">Display Options</h4>
                    <v-text-field
                      type="number"
                      v-model.number="item.scaleWidth"
                      label="Scale minimum width %"
                      dense
                      autocomplete="off"
                      hint="Default 100"
                      persistent-hint
                    />
                  </v-card-text>
                </v-card>
              </div>
            </div>

            <v-btn slot="footer" @click="addColumn" class="align-self-center mx-4 my-6" fab dark small color="primary">
              <v-icon dark>mdi-plus</v-icon>
            </v-btn>
          </draggable>
        </div>
      </v-card-text>
      <v-spacer />
      <v-card-actions class="select-table-actions d-flex justify-end mr-3 align-start">
        <v-btn text class="ml-4" @click="() => $emit('close-dialog')">Close</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import ObjectId from 'bson-objectid';
import draggable from 'vuedraggable';

import appOntologyListEditor from '@/components/builder/OntologyListEditor.vue';
import { resourceLocations, resourceTypes } from '@/utils/resources';

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
  props: {
    value: {
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
  components: {
    appOntologyListEditor,
    draggable,
  },
  data() {
    return {
      deleteDialogIsVisible: false,
      editorDialog: false,
      editOntologyId: null,
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
        const columns = this.value.content.map((item) => ({
          ...item,
          // Compatible with original `autocomplete` question type (https://gitlab.com/OpenTEAM1/draft-tech-feedback/-/issues/56)
          type: item.type === 'autocomplete' ? 'dropdown' : item.type,
        }));
        const fixedColumns = this.value.config.fixedColumns || 0;
        columns.splice(fixedColumns, 0, { isFixedUntilMarker: true });
        return columns;
      },
      set(columns) {
        this.value.config.fixedColumns = Math.max(
          0,
          columns.findIndex((c) => c.isFixedUntilMarker === true)
        );
        this.value.content = columns.filter((c) => c.isFixedUntilMarker !== true);
      },
    },
  },
  methods: {
    log(v) {
      console.log(v);
    },
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
      this.value.content = [...this.value.content, this.createEmptyColumn()];
    },
    onTypeChanged(item, index) {
      const columns = [...this.columns];
      columns[index] = createOptions(item);
      this.columns = columns;
    },
  },
  MATRIX_COLUMN_TYPES,
};
</script>

<style scoped>
.lock-line-decor {
  min-height: initial;
  flex-grow: 1;
  align-self: center;
}
</style>
