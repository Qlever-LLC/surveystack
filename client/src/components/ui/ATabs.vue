<template>
  <v-tabs
    @change="$emit('change', $event)"
    @input="$emit('input', $event)"
    :background-color="backgroundColor"
    :centered="centered"
    :color="color"
    :dark="dark"
    :fixed-tabs="fixedTabs"
    :grow="grow"
    :icons-and-text="iconsAndText"
    :value="value"
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
    value: { type: undefined, required: false },
  },
};
</script>
