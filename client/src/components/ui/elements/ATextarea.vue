<template>
  <v-textarea
    ref="refTextarea"
    @blur="$emit('blur')"
    @dragleave="$emit('dragleave', $event)"
    @dragover="$emit('dragover', $event)"
    @drop="$emit('drop', $event)"
    @input="$emit('input', $event)"
    @update:modelValue="$emit('update:modelValue', $event)"
    :class="{ fontMonospace: cssFontMonospace, markdown: cssMarkdown }"
    :auto-grow="autoGrow"
    :disabled="disabled"
    :hide-details="hideDetails"
    :label="label"
    :modelValue="modelValue"
    :readonly="readonly"
    :rows="rows"
    :rules="rules"
    :variant="variant"
  />
</template>

<script>
export default {
  emits: ['blur', 'dragleave', 'dragover', 'drop', 'input', 'update:modelValue'],
  props: {
    //non vuetify props
    cssFontMonospace: { type: Boolean, required: false },
    cssMarkdown: { type: Boolean, required: false },
    // //vuetify props
    autoGrow: { type: Boolean, required: false },
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
  },
  methods: {
    inputSelectionStart() {
      return this.$refs.refTextarea.$el.querySelector('textarea').selectionStart;
    },
  },
};
</script>

<style scoped>
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
