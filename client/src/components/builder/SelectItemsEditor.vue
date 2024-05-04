<template>
  <a-dialog v-model="state.open" width="500">
    <template v-slot:activator="{ props }">
      <a-text-field
        v-bind="props"
        label="Resource"
        placeholder="Add Options"
        :modelValue="state.label"
        class="mt-6"
        hide-details
        readonly
        variant="outlined"
        :disabled="disabled" />
    </template>

    <a-card>
      <a-card-title class="d-flex justify-space-between align-center text-grey-darken-2">
        Selection List
        <a-btn color="primary" @click="addItem"> <a-icon left>mdi-plus</a-icon>Add Row</a-btn>
      </a-card-title>

      <a-card-text class="dialog-content">
        <div class="row-cell pr-11">
          <div class="flex-grow-1">Label</div>
          <div class="flex-grow-1">Value</div>
        </div>
        <a-divider />
        <div v-if="state.items.length === 0" class="mt-8 text-center">
          Please click <strong>Add row</strong> button to add new item.
        </div>
        <VueDraggable v-else :list="state.items" class="draggable">
          <div v-for="(item, index) in state.items" :key="index" class="row-cell draggable-cursor">
            <a-text-field
              class="flex-grow-1"
              :modelValue="item.label"
              @update:modelValue="onInput(index, 'label', $event)"
              :rules="state.rules"
              :hide-details="false"
              dense />
            <a-text-field
              class="flex-grow-1"
              :modelValue="item.value"
              @update:modelValue="onInput(index, 'value', $event)"
              :rules="state.rules"
              :hide-details="false"
              dense />
            <a-icon color="grey" size="20" @click="() => deleteItem(index)">mdi-delete</a-icon>
          </div>
        </VueDraggable>
      </a-card-text>

      <a-divider />

      <a-card-actions>
        <a-spacer />
        <a-btn variant="text" @click="close">Cancel</a-btn>
        <a-btn color="primary" @click="save" variant="flat">Save</a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script setup>
import { VueDraggable } from 'vue-draggable-plus';
import { computed, reactive, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    required: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const state = reactive({
  value: null,
  open: false,
  items: [...props.modelValue],
  rules: [(val) => !!val || 'Please enter a string'],
  validItems: computed(() => {
    return state.items
      .map((item) => ({ label: item.label.trim(), value: item.value.trim() }))
      .filter((item) => item.label && item.value);
  }),
  label: computed(() => {
    const len = state.validItems.length;
    return len > 1 ? `${len} items` : len === 1 ? '1 item' : undefined;
  }),
});

watch(
  () => state.open,
  async (value, prevValue) => {
    state.items = [...props.modelValue];
  }
);

watch(
  () => props.modelValue,
  async (value, prevValue) => {
    state.items = [...value];
  }
);

function onInput(index, key, value) {
  state.items[index][key] = value;
}
function addItem() {
  state.items.push({ label: '', value: '' });
}
function deleteItem(index) {
  state.items.splice(index, 1);
}
function close() {
  state.open = false;
}
function save() {
  emit('update:modelValue', state.validItems);
  close();
}
</script>

<style scoped>
.dialog-content {
  min-height: 400px;
  max-height: calc(80% - 200px);
  padding: 12px 16px;
}

.dialog-content > :first-child {
  padding-right: 68px;
}

.dialog-content .row-cell {
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialog-content .draggable {
  display: flex;
  flex-direction: column;
  justify-items: start;
  align-items: stretch;
}

.dialog-content .draggable .row-cell {
  margin-top: 8px;
}
</style>
