<template>
  <div>
    <v-dialog v-model="editorDialog">
      <app-ontology-list-editor
        :resources="resources"
        :resource="ontology"
        @change="setResource"
        @delete="removeResource"
        @close-dialog="editorDialog = false"
      />
    </v-dialog>

    <v-card
      min-height="70vh"
      class="d-flex flex-column"
    >
      <v-card-title class="d-block">
        <div class="d-flex justify-space-between align-center">
          <div class="grey--text text--darken-2">
            Matrix Editor
          </div>
          <div class="d-flex align-center ml-auto mr-2">
            <v-btn
              color="primary"
              @click="addColumn"
            >
              <v-icon left>mdi-plus</v-icon>Add Column
            </v-btn>
          </div>
          <div class="d-flex align-center">

            <v-dialog
              v-model="deleteDialogIsVisible"
              max-width="290"
            >
              <template v-slot:activator="{ on }">
                <v-btn
                  icon
                  v-on="on"
                  class="ml-2"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              <v-card>
                <v-card-title>Delete List</v-card-title>
                <v-card-text>
                  Are you sure you want to delete this list: <strong>{{ resource.label }}</strong>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    text
                    color="red"
                    @click="deleteResult"
                  >Delete</v-btn>
                  <v-btn
                    text
                    @click="closeDeleteDialog"
                  >Cancel</v-btn>

                </v-card-actions>
              </v-card>
            </v-dialog>
          </div>

        </div>
      </v-card-title>

      <v-card-text class="pt-4">
        <div class="d-flex flex-space-between align-center">
          <!-- {{ resource.label }} -->
          <v-text-field
            :value="resource.label"
            @input="handleUpdateLabel"
            label="List Label"
            persistent-hint
            class="mx-2"
          />
          <!-- TODO: validate unique data name -->
          <v-text-field
            :value="resource.name"
            @input="handleUpdateName"
            label="List Data Name"
            persistent-hint
            class="mx-2"
            :rules="[nameIsUnique, nameHasValidCharacters, nameHasValidLength]"
          />
        </div>
        <div
          class="d-flex flex-row pa-2 px-4"
          style="overflow-x: auto"
        >
          <v-card
            v-for="(item,i) in resource.content"
            :key="i"
            width="15rem"
            min-width="15rem"
            class="mx-1"
            elevation="3"
          >
            <div class="d-flex pa-2">
              <v-btn
                icon
                small
              >
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <v-btn
                icon
                class="ml-1"
                small
              >
                <v-icon>mdi-arrow-right</v-icon>
              </v-btn>

              <v-btn
                icon
                @click="deleteColumn(i)"
                class="ml-auto"
                tabindex="-1"
                small
              >
                <v-icon>mdi-trash-can-outline</v-icon>
              </v-btn>
            </div>
            <v-card-text>

              <v-text-field
                v-model="item.label"
                label="Label"
                style="font-size: 1.3rem"
                dense
              />

              <v-text-field
                v-model="item.value"
                label="Value"
                dense
              />

              <v-select
                dense
                v-model="item.type"
                :items="$options.MATRIX_COLUMN_TYPES"
                label="Type"
              />

              <div
                v-if="item.type === 'dropdown' || item.type === 'autocomplete'"
                class="d-flex flex-column"
              >
                <div class="d-flex flex-row">
                  <v-select
                    dense
                    v-model="item.resource"
                    :items="resourceSelectItems"
                    label="Resource"
                    hide-details
                  />
                  <v-btn
                    @click="createOntology(i)"
                    small
                    icon
                    :color="!item.resource ? 'primary' : ''"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                  <v-btn
                    @click="openOntologyEditor(item.resource)"
                    small
                    :disabled="!item.resource"
                    icon
                  >
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </div>
                <v-checkbox
                  class="mt-2"
                  v-model="item.multiple"
                  label="Multi-select"
                  hide-details
                  dense
                />

              </div>

            </v-card-text>
          </v-card>

        </div>
      </v-card-text>
      <v-spacer />
      <v-card-actions class="select-table-actions d-flex justify-end mr-3 align-start">
        <v-btn
          text
          class="ml-4"
          @click="() => $emit('close-dialog')"
        >Close</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import ObjectId from 'bson-objectid';

import appOntologyListEditor from '@/components/builder/OntologyListEditor.vue';


const MATRIX_COLUMN_TYPES = [
  { text: 'Ontology - Dropdown', value: 'dropdown' },
  { text: 'Ontology - Auto Complete', value: 'autocomplete' },
  { text: 'Text', value: 'text' },
  { text: 'Number', value: 'number' },
  { text: 'Date', value: 'date' },
];

export default {
  props: {
    resource: {
      type: Object,
      required: true,
      default: () => ({ content: [] }),
    },
    resources: {
      type: Array,
      required: true,
      default: () => ([]),
    },
  },
  components: {
    appOntologyListEditor,
  },
  data() {
    return {
      deleteDialogIsVisible: false,
      editorDialog: false,
      editOntologyId: null,
      tableHeaders: [
        {
          text: 'Label',
          value: 'label',
        },
        {
          text: 'Value',
          value: 'value',
        },
        {
          text: 'Type',
          value: 'type',
        },
        {
          text: 'Resource',
          value: 'resource',
        },
        {
          text: 'Tags',
          value: 'tags',
        },
        {
          text: 'Actions',
          value: 'actions',
          width: 1,
        },
      ],
    };
  },
  computed: {
    resourceNames() {
      return this.resources.map(({ name, id }) => ({ name, id }));
    },
    resourceSelectItems() {
      return this.resources.filter(resource => resource.type === 'ONTOLOGY_LIST').map(resource => ({ text: resource.label, value: resource.id }));
    },
    ontology() {
      return this.resources.find(resource => resource.id === this.editOntologyId);
    },
  },
  methods: {
    removeResource(id) {
      const index = this.resources.findIndex(r => r.id === id);
      const newResources = [
        ...this.resources.slice(0, index),
        ...this.resources.slice(index + 1),
      ];
      this.$emit('set-survey-resources', newResources);
    },
    setResource(resource) {
      const index = this.resources.findIndex(r => r.id === resource.id);
      const newResources = [
        ...this.resources.slice(0, index),
        resource,
        ...this.resources.slice(index + 1),
      ];
      this.$emit('set-survey-resources', newResources);
    },
    createOntology(column) {
      const id = new ObjectId().toString();
      this.resource.content[column].resource = id;
      this.$emit('set-survey-resources', [...this.resources, {
        label: `Ontology List ${this.resources.length + 1}`,
        name: `ontology_list_${this.resources.length + 1}`,
        id,
        type: 'ONTOLOGY_LIST',
        location: 'EMBEDDED',
        content: [],
      }]);
      this.openOntologyEditor(id);
    },
    openOntologyEditor(id) {
      this.editOntologyId = id;
      this.editorDialog = true;
    },
    nameIsUnique(val) {
      return this.resourceNames.some(({ name, id }) => this.resource.name === name && this.resource.id !== id)
        ? 'Name already exists'
        : true;
    },
    nameHasValidCharacters(val) {
      const namePattern = /^[\w]*$/;
      return namePattern.test(val) ? true : 'Must only contain alphanumeric and underscores';
    },
    nameHasValidLength(val) {
      const namePattern = /^.{4,}$/; // one character should be ok, especially within groups
      return namePattern.test(val) ? true : 'Data name must be at least 4 character in length';
    },
    moveItemDown({ id }) {
      const index = this.resource.content.findIndex(item => item.id === id);
      if (index < this.resource.content.length - 1) {
        const newItems = [...this.resource.content];
        const [item] = newItems.splice(index, 1);
        newItems.splice(index + 1, 0, item);
        this.$emit('change', {
          ...this.resource,
          content: newItems,
        });
      }
    },
    moveItemUp({ id }) {
      const index = this.resource.content.findIndex(item => item.id === id);
      if (index > 0) {
        const newItems = [...this.resource.content];
        const [item] = newItems.splice(index, 1);
        newItems.splice(index - 1, 0, item);
        this.$emit('change', {
          ...this.resource,
          content: newItems,
        });
      }
    },
    createEmptyColumn() {
      return {
        id: new ObjectId().toString(),
        label: '',
        value: '',
        type: '',
        resource: '',
        multiple: false,
        tags: '',
      };
    },
    deleteColumn(index) {
      this.resource.content.splice(index, 1);
      this.$emit('change', {
        ...this.resource,
        content: this.resource.content,
      });
    },
    openDeleteDialog() {
      this.deleteDialogIsVisible = true;
    },
    closeDeleteDialog() {
      this.deleteDialogIsVisible = false;
    },
    deleteResult() {
      this.closeDeleteDialog();
      this.$emit('delete', this.resource.id);
      this.$emit('close-dialog');
    },
    handleUpdateLabel(label) {
      this.$emit('change', {
        ...this.resource,
        label,
        // handle: slugify(label),
        // name: slugify(label),
      });
    },
    handleUpdateName(name) {
      this.$emit('change', {
        ...this.resource,
        name,
      });
    },
    addColumn() {
      this.$emit('change', {
        ...this.resource,
        content: [...this.resource.content, this.createEmptyColumn()],
      });
    },
  },
  MATRIX_COLUMN_TYPES,
};
</script>

<style scoped>
</style>
