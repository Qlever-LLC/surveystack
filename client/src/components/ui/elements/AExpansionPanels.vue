<template>
  <v-expansion-panels
    :multiple="multiple"
    :modelValue="modelValue"
    :variant="variant"
    @update:modelValue="$emit('update:modelValue', $event)">
    <slot />
  </v-expansion-panels>
</template>

<script>
export default {
  name: 'AExpansionPanels',
  props: {
    multiple: { type: Boolean, default: false },
    modelValue: { type: undefined, required: false },
    variant: {
      type: String,
      validator: function (value) {
        return ['default', 'inset', 'accordion', 'popout'].includes(value);
      },
      default: 'default',
      required: false,
    },
  },
  emits: ['update:modelValue'],
};
</script>

<style scoped lang="scss"></style>
