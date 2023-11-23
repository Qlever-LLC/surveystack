<template>
  <a-dialog v-model="open" width="500" @click:outside="$refs.anchorRef.blur()">
    <template v-slot:activator="{ on, attrs }">
      <a-text-field
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

    <a-card>
      <a-card-title class="d-flex justify-space-between align-center grey--text text--darken-2">
        Selection List
        <v-btn color="primary" @click="addItem"> <a-icon left>mdi-plus</a-icon>Add Row</v-btn>
      </a-card-title>

      <a-card-text cssDialogContent>
        <div class="row-cell pr-11">
          <div class="flex-grow-1">Label</div>
          <div class="flex-grow-1">Value</div>
        </div>
        <a-divider />
        <div v-if="items.length === 0" class="mt-8 text-center">
          Please click <strong>Add row</strong> button to add new item.
        </div>
        <draggable v-else :list="items" class="draggable">
          <div v-for="(item, index) in items" :key="index" class="row-cell draggable-cursor">
            <a-text-field
              class="flex-grow-1"
              :value="item.label"
              @input="(value) => onInput(index, 'label', value)"
              :rules="rules"
              :hide-details="false"
              dense
            />
            <a-text-field
              class="flex-grow-1"
              :value="item.value"
              @input="(value) => onInput(index, 'value', value)"
              :rules="rules"
              :hide-details="false"
              dense
            />
            <a-icon color="grey" size="20" @click="() => deleteItem(index)">mdi-delete</a-icon>
          </div>
        </draggable>
      </a-card-text>

      <a-divider />

      <a-card-actions>
        <a-spacer />
        <v-btn text @click="close">Cancel</v-btn>
        <v-btn color="primary" @click="save">Save</v-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script>
import draggable from 'vuedraggable';
import ADialog from '@/components/ui/ADialog.vue';

export default {
  components: {
    draggable,
    ADialog,
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
