<template>
  <v-textarea
    ref="refTextarea"
    @blur="trimAndEmitBlur"
    @dragleave="$emit('dragleave', $event)"
    @dragover="$emit('dragover', $event)"
    @drop="$emit('drop', $event)"
    @update:modelValue="$emit('update:modelValue', $event)"
    :class="{ fontMonospace: cssFontMonospace, markdown: cssMarkdown }"
    :auto-grow="autoGrow"
    :clearable="clearable"
    :disabled="disabled"
    :hide-details="hideDetails"
    :label="label"
    :modelValue="modelValue"
    :readonly="readonly"
    :rows="rows"
    :rules="rules"
    :variant="variant" />
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['blur', 'dragleave', 'dragover', 'drop', 'update:modelValue']);

const props = defineProps({
  //non vuetify props
  cssFontMonospace: { type: Boolean, required: false },
  cssMarkdown: { type: Boolean, required: false },
  // //vuetify props
  autoGrow: { type: Boolean, required: false },
  clearable: { type: Boolean, required: false },
  disabled: { type: Boolean, required: false },
  hideDetails: { type: [Boolean, String], required: false },
  label: { type: String, required: false },
  modelValue: { type: undefined, required: false },
  readonly: { type: Boolean, required: false },
  rows: { type: [Number, String], required: false },
  rules: { type: Array, required: false },
  variant: {
    type: String,
    validator: function (value) {
      return ['underlined', 'outlined', 'filled', 'solo', 'solo-inverted', 'solo-filled', 'plain'].includes(value);
    },
    required: false,
    default: 'filled',
  },
});

function trimAndEmitBlur() {
  if (props.modelValue) {
    const value = props.modelValue.trim();
    emit('update:modelValue', value);
  }
  emit('blur');
}

const refTextarea = ref(null);

function inputSelectionStart() {
  return refTextarea.value.$el.querySelector('textarea').selectionStart;
}

defineExpose({ inputSelectionStart });
</script>

<style scoped lang="scss">
.fontMonospace {
  font-family: monospace;
  font-size: 0.8rem;
}

.markdown {
  margin: 0px;
  padding: 0px;
}

.markdown >>> textarea {
  width: 100%;
  height: 100%;
  min-height: 160px;
  max-height: 500px;
  padding: 2px 8px;
  border: 1px solid #ddd;
  overflow: hidden auto;
  outline: none;
}

.markdown >>> textarea:read-only {
  border: 1.5px dashed #888;
  border-radius: 4px;
}

.markdown >>> .v-textarea.resource textarea {
  min-height: 400px;
}

.markdown >>> .v-input__slot:before,
.markdown >>> .v-input__slot:after {
  border: none !important;
  transition: none;
}
</style>
