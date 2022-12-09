<template>
  <v-dialog v-model="open" width="500">
    <template v-slot:activator="{ on, attrs }">
      <v-text-field class="mt-3" label="Resource" hide-details v-on="on" v-bind="attrs" />
    </template>

    <v-card>
      <v-card-title class="d-flex justify-space-between align-center grey--text text--darken-2">
        Selection List
        <v-btn color="primary" @click="addItem"> <v-icon left>mdi-plus</v-icon>Add Row </v-btn>
      </v-card-title>

      <v-card-text class="dialog-content">
        <div class="row-cell pr-11">
          <div class="flex-grow-1">Label</div>
          <div class="flex-grow-1">Value</div>
        </div>
        <v-divider></v-divider>
        <div v-if="items.length === 0" class="mt-8 text-center">
          Please click <strong>Add row</strong> button to add new item.
        </div>
        <draggable v-else :list="items" class="draggable">
          <div v-for="(item, index) in items" :key="index" class="row-cell draggable-cursor">
            <v-text-field
              class="flex-grow-1"
              :value="item.label"
              @input="(value) => handleItemInput(index, 'label', value)"
              :rules="rules"
              hide-details
              dense
            />
            <v-text-field
              class="flex-grow-1"
              :value="item.value"
              @input="(value) => handleItemInput(index, 'value', value)"
              :rules="rules"
              hide-details
              dense
            />
            <v-icon color="grey" size="20" @click="() => deleteItem(index)">mdi-delete</v-icon>
          </div>
        </draggable>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="close">Cancel</v-btn>
        <v-btn color="primary" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import draggable from 'vuedraggable';

export default {
  components: {
    draggable,
  },
  props: {
    value: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      open: false,
      items: [],
      rules: [(val) => val || 'Please enter a string'],
    };
  },
  methods: {
    close() {
      this.open = false;
    },
    save() {
      this.$emit('set-control-source', this.items);
      this.close();
    },
    handleItemInput(index, key, value) {
      this.items[index][key] = value;
    },
    addItem() {
      this.items.push([{ label: '', value: '' }]);
    },
    deleteItem(index) {
      this.items.splice(index, 1);
    },
  },
  watch: {
    value(newVal) {
      this.items = newVal;
    },
  },
};
</script>

<style scoped>
>>> .dialog-content {
  min-height: 400px;
  max-height: calc(80% - 200px);
  padding: 12px 16px;
}

>>> .dialog-content > :first-child {
  padding-right: 68px;
}

>>> .dialog-content .row-cell {
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}

>>> .dialog-content .draggable {
  display: flex;
  flex-direction: column;
  justify-items: start;
  align-items: stretch;
}

>>> .dialog-content .draggable .row-cell {
  margin-top: 8px;
}
</style>
