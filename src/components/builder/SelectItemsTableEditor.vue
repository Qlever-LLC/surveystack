<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between">
      <span>
        Edit Select Options
      </span>
      <select-items-upload-button @change="handleFileChange" class="mt-4 mb-n2" />
    </v-card-title>

    <v-card-text>
      <v-data-table
        :headers="tableHeaders"
        :items="items"
      >
        <!-- <template v-slot:top>
          <v-toolbar flat color="white">
            <v-toolbar-title>Edit Select Options</v-toolbar-title>

          </v-toolbar>
        </template> -->
        <template v-slot:item.actions="{ item }">
          <v-icon
            @click="deleteItem(item)"
          >
            mdi-delete
          </v-icon>
        </template>
      </v-data-table>
    </v-card-text>

    <v-card-actions class="select-table-actions d-flex justify-end mr-3 align-start">
      <!-- <v-btn class="ml-4" @click="handleSave">Save</v-btn> -->
      <!-- <v-btn text class="ml-4" @click="() => $emit('close-dialog')">Close</v-btn> -->
    </v-card-actions>
  </v-card>
</template>

<script>
import { uniqWith, isEqual } from 'lodash';

import SelectItemsUploadButton from '@/components/builder/SelectItemsUploadButton.vue';

export default {
  props: {
    items: {
      type: Array,
      required: true,
    },
  },
  components: {
    SelectItemsUploadButton,
  },
  data() {
    return {
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
  methods: {
    handleFileChange(data) {
      console.log('table editor file change', data);
      this.appendItems(data);
    },
    handleSave() {
      // this.$emit('close-dialog');
      // this.$emit('change', this.)
    },
    deleteItem(item) {
      const newItems = this.items.filter(x => x.label !== item.label && x.value !== item.value);
      console.log('delete item, new items:', newItems);
      this.$emit('change', newItems);
    },
    filterDuplicateItems(items) {
      return uniqWith(items, isEqual);
    },
    appendItems(items) {
      this.$emit('change', this.filterDuplicateItems([
        ...this.items,
        ...items,
      ]));
    },
  },
};
</script>

<style scoped>

</style>
