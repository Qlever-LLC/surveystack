<template>
  <v-checkbox
    :color="color"
    :density="dense ? 'compact' : 'default'"
    :disabled="disabled"
    :hide-details="hideDetails"
    :hint="hint"
    :indeterminate="indeterminate"
    :label="label"
    :modelValue="modelValue"
    :persistent-hint="persistentHint"
    :rules="rules"
    :true-value="trueValue"
    :value="selectedItem"
    @click="$emit('click', $event)"
    @update:modelValue="$emit('update:modelValue', $event)">
    <template v-slot:append v-if="helperText || $slots['helper-text']">
      <v-tooltip max-width="400" transition="slide-x-transition" right>
        <template v-slot:activator="{ on, attrs }">
          <v-icon v-bind="attrs" v-on="on" size="20">mdi-help-circle-outline</v-icon>
        </template>
        <slot name="helper-text"></slot>
        <span v-if="helperText">{{ helperText }}</span>
      </v-tooltip>
    </template>
  </v-checkbox>
</template>

<script>
export default {
  emits: ['click', 'update:modelValue'],
  props: {
    modelValue: {
      //set by v-model
      type: undefined, //typically a boolean or an array (then combined with the value prop
      required: false,
    },
    selectedItem: {
      type: undefined,
      default: undefined,
    },
    trueValue: {
      type: undefined,
      required: false,
    },
    indeterminate: {
      type: Boolean,
      required: false,
    },
    rules: {
      type: undefined,
      required: false,
    },
    hint: {
      type: undefined,
      required: false,
    },
    persistentHint: {
      type: Boolean,
      required: false,
    },
    hideDetails: {
      type: Boolean,
      default: true, //yes, we usually want to hide details as there's no validation
    },
    label: {
      type: String,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    dense: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      required: false,
    },
    helperText: {
      type: String,
    },
  },
};
</script>
