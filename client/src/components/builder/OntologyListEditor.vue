<template>
  <a-card min-height="70vh" class="d-flex flex-column">
    <a-card-title class="d-block">
      <div class="d-flex justify-space-between align-center">
        <div class="text-grey-darken-2">Ontology List Editor</div>
        <div class="d-flex align-center ml-auto mr-2">
          <a-btn
            color="primary"
            style="margin-top: 2px"
            @click="
              editedItem = createEmptyItem();
              editItemDialogIsVisible = true;
            "
            :disabled="disabled">
            <a-icon left>mdi-plus</a-icon>Add Row
          </a-btn>
        </div>
        <div class="d-flex align-center">
          <select-items-upload-button @change="uploadCSV" class="mt-4 mr-2 mb-n2" :disabled="disabled">
            <a-tooltip bottom activator="parent"
              >CSV must have column headers 'label', 'value', and optionally 'tags'</a-tooltip
            >
          </select-items-upload-button>
          <select-items-download-button :resourceName="resource.name" :items="resource.content" class="mt-1" />
          <a-dialog v-model="deleteDialogIsVisible" max-width="290">
            <template v-slot:activator="{ props }">
              <a-btn icon v-bind="props" class="ml-2" :disabled="disabled">
                <a-icon>mdi-delete</a-icon>
                <!-- Delete List -->
              </a-btn>
            </template>
            <a-card>
              <a-card-title>Delete List</a-card-title>
              <a-card-text>
                Are you sure you want to delete this list: <strong>{{ resource.label }}</strong>
              </a-card-text>
              <a-card-actions>
                <a-spacer />
                <a-btn variant="text" color="red" @click="deleteResult">Delete</a-btn>
                <a-btn variant="text" @click="closeDeleteDialog">Cancel</a-btn>
              </a-card-actions>
            </a-card>
          </a-dialog>
        </div>
      </div>
      <a-divider />
    </a-card-title>

    <a-card-text class="pt-4">
      <div class="d-flex flex-space-between align-center">
        <!-- {{ resource.label }} -->
        <a-text-field
          :modelValue="resource.label"
          @update:modelValue="handleUpdateLabel"
          :disabled="disabled"
          label="List Label"
          persistent-hint
          class="mx-2" />
        <!-- TODO: validate unique data name -->
        <a-text-field
          :modelValue="resource.name"
          @update:modelValue="handleUpdateName"
          :disabled="disabled"
          label="List Data Name"
          persistent-hint
          class="mx-2"
          :rules="[nameIsUnique, nameHasValidCharacters, nameHasValidLength]" />

        <a-text-field v-model="search" append-inner-icon="mdi-magnify" class="mx-4" label="Search" />
        <div>
          <a-btn icon @click="deleteSelectedItems" :disabled="!selectedItems.length || disabled">
            <a-icon>mdi-delete</a-icon>
          </a-btn>
        </div>
      </div>

      <a-data-table
        :headers="tableHeaders"
        :items="resource.content"
        showSelect
        v-model="selectedItems"
        :search="search"
        itemValue="id"
        labelSlot
        valueSlot
        tagsSlot
        actionsSlot>
        <template v-slot:label="{ item }">
          <a-text-field v-model="item.label" :disabled="disabled" variant="solo" dense hide-details />
        </template>
        <template v-slot:value="{ item }">
          <a-text-field v-model="item.value" :disabled="disabled" variant="solo" dense hide-details />
        </template>
        <template v-slot:tags="{ item }">
          <a-text-field v-model="item.tags" :disabled="disabled" variant="solo" dense hide-details />
        </template>
        <template v-slot:actions="{ item }">
          <div class="d-flex">
            <a-btn @click="moveItemUp(item)" tabindex="-1" :disabled="disabled" icon small>
              <a-icon icon="mdi-arrow-up" />
            </a-btn>
            <a-btn
              class="ml-2"
              @click="moveItemDown(item)"
              tabindex="-1"
              :disabled="disabled"
              icon
              variant="flat"
              small>
              <a-icon icon="mdi-arrow-down" />
            </a-btn>
            <a-btn class="ml-2" @click="copyItem(item)" tabindex="-1" :disabled="disabled" icon small>
              <a-icon icon="mdi-content-copy" />
            </a-btn>
            <a-btn class="ml-2" @click="deleteItem(item)" tabindex="-1" :disabled="disabled" icon small>
              <a-icon icon="mdi-trash-can-outline" />
            </a-btn>
          </div>
        </template>
      </a-data-table>
    </a-card-text>
    <a-spacer />
    <a-card-actions class="d-flex justify-end mr-3 align-start">
      <a-btn variant="text" class="ml-4" @click="close">Close</a-btn>
    </a-card-actions>

    <a-dialog v-model="editItemDialogIsVisible" max-width="350">
      <a-card>
        <a-card-title>Edit Item</a-card-title>
        <a-card-text>
          <a-text-field v-model="editedItem.label" label="Label" />
          <a-text-field v-model="editedItem.value" label="Value" />
          <a-text-field v-model="editedItem.tags" label="Tags" />
        </a-card-text>
        <a-card-actions>
          <a-spacer />
          <a-btn variant="text" @click="editItemDialogIsVisible = false">Cancel</a-btn>
          <a-btn variant="text" color="primary" @click="saveItem">Save</a-btn>
        </a-card-actions>
      </a-card>
    </a-dialog>
  </a-card>
</template>

<script>
import { isEqual, uniqWith } from 'lodash';
import ObjectId from 'bson-objectid';
import SelectItemsUploadButton from '@/components/builder/SelectItemsUploadButton.vue';
import SelectItemsDownloadButton from '@/components/builder/SelectItemsDownloadButton';

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
    disabled: {
      type: Boolean,
      required: false,
      default: () => false,
    },
  },
  components: {
    SelectItemsDownloadButton,
    SelectItemsUploadButton,
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
          title: 'Label',
          value: 'label',
          sortable: false,
        },
        {
          title: 'Value',
          value: 'value',
          sortable: false,
        },
        {
          title: 'Tags',
          value: 'tags',
          sortable: false,
        },
        {
          title: 'Actions',
          value: 'actions',
          sortable: false,
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
        id: new ObjectId().toString(),
        label: '',
        value: '',
        tags: '',
      };
    },
    copyItem(item) {
      const index = this.resource.content.findIndex((row) => row.id === item.id);
      if (index >= 0) {
        this.resource.content.splice(index + 1, 0, {
          id: new ObjectId().toString(),
          label: `${item.label} Copy`,
          value: `${item.value}_copy`,
          tags: item.tags,
        });
        this.$emit('change', {
          ...this.resource,
          content: this.resource.content,
        });
      }
    },
    deleteSelectedItems() {
      const isNotSelectedItem = (item) => !this.selectedItems.some((s) => s === item.id);
      const newItems = this.resource.content.filter(isNotSelectedItem);
      this.selectedItems = [];
      this.$emit('change', {
        ...this.resource,
        content: newItems,
      });
    },
    openItemEditDialog(item) {
      this.editItemDialogIsVisible = true;
      this.editedItem = { ...item };
    },
    saveItem() {
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
      } else {
        const newItems = [...this.resource.content, this.editedItem];
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
    matchValidItem(item) {
      return item.label.trim() && item.value.trim();
    },
    close() {
      const content = this.resource.content
        .map((item) => ({
          ...item,
          value: typeof item.value === 'string' ? item.value.trim() : item.value,
        }))
        .filter(this.matchValidItem);
      this.$emit('change', { ...this.resource, content });
      this.$emit('close-dialog');
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
      });
    },
    handleUpdateName(name) {
      this.$emit('change', {
        ...this.resource,
        name,
      });
    },
    uploadCSV(data) {
      this.appendItems(data);
    },
    deleteItem(item) {
      const newItems = this.resource.content.filter((x) => x.label !== item.label && x.value !== item.value);
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

<style scoped lang="scss">
.v-data-table >>> tbody > tr > td.text-start {
  padding: 0px 4px;
}

.v-data-table >>> tbody > tr > td > .v-simple-checkbox {
  margin-left: 12px;
}
</style>
