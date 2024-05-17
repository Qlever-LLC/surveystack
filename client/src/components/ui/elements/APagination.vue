<template>
  <v-pagination
    @update:modelValue="$emit('update:modelValue', $event)"
    :color="color"
    :length="length"
    :modelValue="modelValue" />
</template>

<script>
export default {
  emits: ['update:modelValue'],
  props: {
    //vuetify props
    color: { type: String, required: false },
    length: { type: [String, Number], required: false },
    modelValue: { type: undefined, required: false },
  },
};
</script>
