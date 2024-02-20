<template>
  <a-date
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
    :dense="dense"
    hide-details
    label="Default value"
    :menu-props="{ offsetY: true }"
    :type="type"
    menuMinWidth="auto"
    readonly
    cssTFmt3 />
</template>

<script>
export default {
  emits: ['blur', 'update:modelValue'],
  props: {
    modelValue: { type: String },
    type: { type: String },
    dense: { type: Boolean, default: false },
  },
};
</script>
