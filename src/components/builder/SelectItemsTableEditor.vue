<template>
  <v-card min-height="70vh" class="d-flex flex-column">
    <v-card-title class="d-block">
      <div class="d-flex justify-space-between align-center">
        <div class="grey--text text--darken-2">
          Dropdown List Editor
        </div>
        <div class="d-flex align-center">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <select-items-upload-button @change="handleFileChange" class="mt-4 mb-n2" />
              </div>
            </template>
            CSV must have column headers 'label', 'value', and optionally 'tags'
          </v-tooltip>
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
          label="List Label"
          persistent-hint
          class="display-1 flex-shrink-1"
          style="max-width: 12em;"
        />
        <!-- TODO: validate unique data name -->
        <v-text-field
          :value="resource.name"
          @input="handleUpdateName"
          label="List Data Name"
          persistent-hint
          class="flex-shrink-1 ml-4"
          style="max-width: 12em;"
          :rules="[nameIsUnique, nameHasValidCharacters, nameHasValidLength]"
        />
        <v-spacer />
        <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" />
        <v-spacer />
        <div>
          <v-btn icon @click="deleteSelectedItems" :disabled="!selectedItems.length">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </div>
      </div>
      <v-data-table
        :headers="tableHeaders"
        :items="resource.content"
        show-select
        v-model="selectedItems"
        :search="search"
        item-key="id"
      >
        <!-- <template v-slot:top>
          <v-toolbar flat color="white">
            <v-toolbar-title>Edit Select Options</v-toolbar-title>

          </v-toolbar>
        </template> -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex">
            <v-icon @click="moveItemUp(item)">mdi-arrow-up</v-icon>
            <v-icon class="ml-2" @click="moveItemDown(item)">mdi-arrow-down</v-icon>
            <v-icon class="ml-2" @click="openItemEditDialog(item)">mdi-pencil</v-icon>
            <v-icon class="ml-2" @click="deleteItem(item)">mdi-delete</v-icon>
          </div>
        </template>
      </v-data-table>
    </v-card-text>
    <v-spacer />
    <v-card-actions class="select-table-actions d-flex justify-end mr-3 align-start">
      <v-dialog v-model="deleteDialogIsVisible" max-width="290">
        <template v-slot:activator="{ on }">
          <v-btn text v-on="on" color="error" class="ml-2">
            <!-- <v-icon>mdi-delete</v-icon> -->
            Delete
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
            <v-btn text color="red" @click="deleteResult">Delete</v-btn>
            <v-btn text @click="closeDeleteDialog">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <!-- <v-btn class="ml-4" @click="handleSave">Save</v-btn> -->
      <v-btn text class="ml-4" @click="() => $emit('close-dialog')">Close</v-btn>
    </v-card-actions>

    <v-dialog v-model="editItemDialogIsVisible" @input="updateEditItem" max-width="350">
      <v-card>
        <v-card-title>Edit Item</v-card-title>
        <v-card-text>
          <v-text-field v-model="editedItem.label" label="Label" />
          <v-text-field v-model="editedItem.value" label="Value" />
          <v-text-field v-model="editedItem.tags" label="Tags" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text color="primary" @click="closeItemEditDialog">Ok</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { uniqWith, isEqual } from 'lodash';
import slugify from '@/utils/slugify';

import SelectItemsUploadButton from '@/components/builder/SelectItemsUploadButton.vue';

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
      default: () => [],
    },
  },
  components: {
    SelectItemsUploadButton,
  },
  data() {
    return {
      editedItem: this.createEmptyItem(),
      search: '',
      deleteDialogIsVisible: false,
      selectedItems: [],
      editItemId: null,
      editItemDialogIsVisible: false,
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
  },
  methods: {
    nameIsUnique(val) {
      // return this.resourceNames.some(({ name, id }) => this.resource.name === name && this.resource.id !== id)
      //   ? 'Name must be unique'
      //   : true;
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
    moveItemDown({ id }) {
      const index = this.resource.content.findIndex((item) => item.id === id);
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
      const index = this.resource.content.findIndex((item) => item.id === id);
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
    createEmptyItem() {
      return {
        id: '',
        label: '',
        value: '',
        tags: '',
      };
    },
    deleteSelectedItems() {
      const isNotSelectedItem = (item) => !this.selectedItems.some((s) => s.id === item.id);
      const newItems = this.resource.content.filter(isNotSelectedItem);
      this.selectedItems = [];
      this.$emit('change', {
        ...this.resource,
        content: newItems,
      });
    },
    openItemEditDialog(item) {
      this.editItemDialogIsVisible = true;
      this.editItemId = item.id;
      this.editedItem = { ...item };
    },
    closeItemEditDialog() {
      this.editItemDialogIsVisible = false;
      this.updateEditItem();
    },
    handleEditDialogInput(val) {
      if (!val) {
        this.updateEditItem();
      }
    },
    updateEditItem() {
      const index = this.resource.content.findIndex((item) => item.id === this.editedItem.id);
      // const index = this.resource.content.findIndex(c => c.id === this.editItemId);
      if (index > -1) {
        const newItems = [
          ...this.resource.content.slice(0, index),
          this.editedItem,
          ...this.resource.content.slice(index + 1),
        ];
        this.$emit('change', {
          ...this.resource,
          content: newItems,
        });
      }
      this.editedItem = this.createEmptyItem();
      this.editItemId = null;
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
      // console.log('table editor file change', data);
      this.appendItems(data);
    },
    handleSave() {
      // this.$emit('close-dialog');
      // this.$emit('change', this.)
    },
    deleteItem(item) {
      const newItems = this.resource.content.filter((x) => x.label !== item.label && x.value !== item.value);
      console.log('delete item, new items:', JSON.stringify(newItems, null, 2));
      this.$emit('change', {
        ...this.resource,
        content: newItems,
      });
    },
    filterDuplicateItems(items) {
      return uniqWith(items, isEqual);
    },
    appendItems(items) {
      const content = this.filterDuplicateItems([...this.resource.content, ...items]);
      this.$emit('change', {
        ...this.resource,
        content,
      });
    },
  },
};
</script>

<style scoped></style>
