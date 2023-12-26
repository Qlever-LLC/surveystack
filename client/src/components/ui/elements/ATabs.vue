<template>
  <v-tabs
    @update:modelValue="handleCustomChange"
    :background-color="backgroundColor"
    :centered="centered"
    :color="color"
    :dark="dark"
    :fixed-tabs="fixedTabs"
    :grow="grow"
    :icons-and-text="iconsAndText"
    :modelValue="modelValue"
  >
    <slot />
  </v-tabs>
</template>

<script>
export default {
  emits: ['change', 'input'],
  props: {
    //vuetify props
    backgroundColor: { type: String, required: false },
    centered: { type: Boolean, required: false },
    color: { type: String, required: false },
    dark: { type: String, required: false },
    fixedTabs: { type: Boolean, required: false },
    grow: { type: Boolean, required: false },
    iconsAndText: { type: Boolean, required: false },
    modelValue: { type: undefined, required: false },
  },
  methods: {
    handleCustomChange(event) {
      // @change emits input for v-model case
      this.$emit('input', event);
      this.$emit('change', event);
    },
  },
};
</script>
