<template>
  <v-dialog v-model="open" width="500" @click:outside="$refs.anchorRef.blur()">
    <template v-slot:activator="{ on, attrs }">
      <v-text-field
        v-on="on"
        v-bind="attrs"
        ref="anchorRef"
        label="Resource"
        placeholder="Add Options"
        :value="getLabel"
        class="mt-6"
        :class="$vnode.data.staticClass"
        hide-details
        readonly
        outlined
        :disabled="disabled"
      />
    </template>

    <v-card>
      <v-card-title class="d-flex justify-space-between align-center grey--text text--darken-2">
        Selection List
        <a-btn color="primary" @click="addItem"> <v-icon left>mdi-plus</v-icon>Add Row </a-btn>
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
              @input="(value) => onInput(index, 'label', value)"
              :rules="rules"
              :hide-details="false"
              dense
            />
            <v-text-field
              class="flex-grow-1"
              :value="item.value"
              @input="(value) => onInput(index, 'value', value)"
              :rules="rules"
              :hide-details="false"
              dense
            />
            <v-icon color="grey" size="20" @click="() => deleteItem(index)">mdi-delete</v-icon>
          </div>
        </draggable>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <a-btn text @click="close">Cancel</a-btn>
        <a-btn color="primary" @click="save">Save</a-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import draggable from 'vuedraggable';
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: {
    ABtn,
    draggable,
  },
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    disabled: {
      type: Boolean,
      required: false,
    },
  },
  model: {
    prop: 'value',
    event: 'set-control-source',
  },
  data() {
    return {
      open: false,
      items: [],
      rules: [(val) => !!val || 'Please enter a string'],
    };
  },
  computed: {
    validItems() {
      return this.items
        .map((item) => ({ label: item.label.trim(), value: item.value.trim() }))
        .filter((item) => item.label && item.value);
    },
    getLabel() {
      const len = this.validItems.length;
      return len > 1 ? `${len} items` : len === 1 ? '1 item' : undefined;
    },
  },
  methods: {
    onInput(index, key, value) {
      this.items[index][key] = value;
    },
    addItem() {
      this.items.push({ label: '', value: '' });
    },
    deleteItem(index) {
      this.items.splice(index, 1);
    },
    close() {
      this.open = false;
      this.$refs.anchorRef.blur();
    },
    save() {
      this.$emit('set-control-source', this.validItems);
      this.close();
    },
  },
  watch: {
    open() {
      this.items = [...this.value];
    },
    value(newVal) {
      this.items = [...newVal];
    },
  },
  created() {
    this.items = [...this.value];
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
