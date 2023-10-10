<template>
  <v-checkbox
    :input-value="value"
    :value="selectedValue"
    @change="change"
    :color="color"
    :dense="dense"
    :disabled="disabled"
    :hide-details="hideDetails"
    :label="label"
  >
    <template slot="append" v-if="helperText || $slots['helper-text']">
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
  props: {
    value: {
      //set by v-model
      type: undefined, //typically a boolean or an array (then combined with the value prop
      default: false,
    },
    selectedValue: {
      type: undefined,
      default: undefined,
    },
    hideDetails: {
      type: Boolean,
      default: true, //yes, we usually wwant to hide details as there's not validation
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
  methods: {
    change(value) {
      this.$emit('input', value);
      //this.$emit('change', value);
    },
  },
};
</script>
