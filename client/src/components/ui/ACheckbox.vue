<template>
  <v-checkbox
    :model-value="value"
    @change="$emit('change', $event)"
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
      type: Boolean,
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
};
</script>
