<template>
  <v-card
    min-height="70vh"
    class="d-flex flex-column"
  >
    <v-card-title class="d-block">
      <div class="d-flex justify-space-between align-center">
        <div class="grey--text text--darken-2">
          Matrix Editor
        </div>
        <div class="d-flex align-center">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <app-matrix-editor-upload-button
                  @change="handleFileChange"
                  class="mt-4 mb-n2"
                />
              </div>
            </template>
            CSV column headers may specify type with header|TYPE, where TYPE=text,number,date,dropdown,autocomplete
          </v-tooltip>
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
                <!-- Delete List -->
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
      <v-divider />
    </v-card-title>

    <v-card-text class="pt-4">
      <div class="d-flex flex-space-between align-center">
        <!-- {{ resource.label }} -->
        <v-text-field
          :value="resource.label"
          @input="handleUpdateLabel"
          label="Label"
          persistent-hint
          class="display-1 flex-shrink-1"
          style="max-width: 12em;"
        />
        <!-- TODO: validate unique data name -->
        <v-text-field
          :value="resource.name"
          @input="handleUpdateName"
          label="specifier"
          persistent-hint
          class="flex-shrink-1 ml-4"
          style="max-width: 12em;"
          :rules="[nameIsUnique, nameHasValidCharacters, nameHasValidLength]"
        />
        <v-spacer />
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
        />
        <v-spacer />
        <div>
          <v-btn
            icon
            @click="deleteSelectedItems"
            :disabled="!selectedItems.length"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </div>
      </div>
      <v-data-table
        :headers="headers"
        :items="items"
        show-select
        v-model="selectedItems"
        :search="search"
        item-key="_row"
      >
        <!-- <template v-slot:top>
          <v-toolbar flat color="white">
            <v-toolbar-title>Edit Select Options</v-toolbar-title>

          </v-toolbar>
        </template> -->
        <template v-slot:item._actions="{ item }">
          <div class="d-flex">
            <v-icon @click="moveItemUp(item)">mdi-arrow-up</v-icon>
            <v-icon
              class="ml-2"
              @click="moveItemDown(item)"
            >mdi-arrow-down</v-icon>
            <v-icon
              class="ml-2"
              @click="openItemEditDialog(item)"
            >mdi-pencil</v-icon>
          </div>
        </template>
      </v-data-table>
    </v-card-text>
    <v-spacer />
    <v-card-actions class="select-table-actions d-flex justify-end mr-3 align-start">
      <!-- <v-btn class="ml-4" @click="handleSave">Save</v-btn> -->
      <v-btn
        text
        class="ml-4"
        @click="() => $emit('close-dialog')"
      >Close</v-btn>
    </v-card-actions>

    <v-dialog
      v-model="editItemDialogIsVisible"
      max-width="350"
    >
      <v-card>
        <v-card-title>Edit Item</v-card-title>
        <v-card-text>
          <div
            v-for="header in headers"
            :key="header.value"
          >
            <v-text-field
              :value="editedItem[header.value]"
              @input="v => {editedItem[header.value] = (header.type === 'number') ? Number(v) : v}"
              :label="header.value"
              v-if="!header.value.startsWith('_')"
            />
          </div>

        </v-card-text>
        <v-card-actions class="pa-4">
          <v-btn
            color="error"
            @click="editItemDialogIsVisible = false; deleteItem(editedItem)"
          >DELETE</v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            @click="editItemDialogIsVisible = false; updateEditItem()"
          >SAVE</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { uniqWith, isEqual } from 'lodash';
import slugify from '@/utils/slugify';

import appMatrixEditorUploadButton from '@/components/builder/MatrixEditorUploadButton.vue';

export default {
  props: {
    resource: {
      type: Object,
      required: true,
      default: () => ({
        content: {
          headers: [],
          fields: [],
          data: [],
        },
      }),
    },
    resources: {
      type: Array,
      required: true,
      default: () => ([]),
    },
  },
  components: {
    appMatrixEditorUploadButton,
  },
  data() {
    return {
      editedItem: this.createEmptyItem(),
      search: '',
      deleteDialogIsVisible: false,
      selectedItems: [],
      editItemDialogIsVisible: false,
      tableHeaders: [
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
    items() {
      return this.resource.content.data;
    },
    headers() {
      return [...this.resource.content.headers, {
        text: 'actions',
        value: '_actions',
        width: 1,
      }];
    },
  },
  methods: {
    nameIsUnique(val) {
      return this.resourceNames.some(({ name, id }) => val === name && this.resource.id !== id)
        ? 'Name must be unique'
        : true;
    },
    nameHasValidCharacters(val) {
      const namePattern = /^[\w]*$/;
      return namePattern.test(val) ? true : 'Data name must only contain valid charcters';
    },
    nameHasValidLength(val) {
      const namePattern = /^.{4,}$/; // one character should be ok, especially within groups
      return namePattern.test(val) ? true : 'Data name must be at least 4 character in length';
    },
    moveItemDown({ _row }) {
      const index = this.resource.content.data.findIndex(item => item._row === _row);
      if (index < this.resource.content.data.length - 1) {
        const newItems = [...this.resource.content.data];
        const [item] = newItems.splice(index, 1);
        newItems.splice(index + 1, 0, item);
        this.$emit('change', {
          ...this.resource,
          content: {
            ...this.resource.content,
            data: newItems,
          },
        });
      }
    },
    moveItemUp({ _row }) {
      const index = this.resource.content.data.findIndex(item => item._row === _row);
      if (index > 0) {
        const newItems = [...this.resource.content.data];
        const [item] = newItems.splice(index, 1);
        newItems.splice(index - 1, 0, item);
        this.$emit('change', {
          ...this.resource,
          content: {
            ...this.resource.content,
            data: newItems,
          },
        });
      }
    },
    createEmptyItem() {
      return {
        id: '',
        label: '',
        value: '',
        tags: '',
      };
    },
    deleteSelectedItems() {
      const isNotSelectedItem = item => !this.selectedItems.some(s => s._row === item._row);
      const newItems = this.resource.content.data.filter(isNotSelectedItem);
      this.selectedItems = [];
      this.$emit('change', {
        ...this.resource,
        content: {
          ...this.resource.content,
          data: newItems,
        },
      });
    },
    openItemEditDialog(item) {
      this.editItemDialogIsVisible = true;
      this.editedItem = { ...item };
    },
    handleEditDialogInput(val) {
      if (!val) {
        this.updateEditItem();
      }
    },
    updateEditItem() {
      const index = this.resource.content.data.findIndex(item => item._row === this.editedItem._row);
      if (index > -1) {
        const newItems = [
          ...this.resource.content.data.slice(0, index),
          this.editedItem,
          ...this.resource.content.data.slice(index + 1),
        ];
        this.$emit('change', {
          ...this.resource,
          content: {
            ...this.resource.content,
            data: newItems,
          },
        });
      }
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
      console.log('update label');
      this.$emit('change', {
        ...this.resource,
        label,
        // handle: slugify(label),
        // name: slugify(label),
      });
    },
    handleUpdateName(name) {
      console.log('update name', name);
      this.$emit('change', {
        ...this.resource,
        name,
      });
    },
    handleFileChange(data) {
      this.setContent(data);
    },
    handleSave() {
      // this.$emit('close-dialog');
      // this.$emit('change', this.)
    },
    deleteItem({ _row }) {
      const newItems = this.resource.content.data.filter(x => x._row !== _row);
      this.$emit('change', {
        ...this.resource,
        content: {
          ...this.resource.content,
          data: newItems,
        },
      });
    },
    setContent(content) {
      this.$emit('change', {
        ...this.resource,
        content,
      });
    },
  },
};
</script>

<style scoped>
</style>
