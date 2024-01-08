<template>
  <v-radio-group
    :modelValue="value"
    @update:modelValue="$emit('update:modelValue', $event)"
    :name="name"
    :disabled="disabled"
    :hide-details="hideDetails">
    <slot />
  </v-radio-group>
</template>

<script>
export default {
  name: 'ARadioGroup',
  props: {
    modelValue: { type: undefined, required: false },
    name: { type: String, required: false },
    disabled: { type: Boolean, required: false },
    hideDetails: { type: [Boolean, String], required: false },
  },
  computed: {
    value() {
      return this.modelValue;
    },
  },
};
</script>
