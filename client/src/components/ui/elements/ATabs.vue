<template>
  <v-tabs
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :bg-color="bgColor"
    :color="color"
    :fixed-tabs="fixedTabs"
    :grow="grow">
    <slot />
  </v-tabs>
</template>

<script>
export default {
  props: {
    //vuetify props
    bgColor: { type: String, required: false },
    color: { type: String, required: false },
    fixedTabs: { type: Boolean, required: false },
    grow: { type: Boolean, required: false },
    modelValue: { type: undefined, required: false },
  },
};
</script>
