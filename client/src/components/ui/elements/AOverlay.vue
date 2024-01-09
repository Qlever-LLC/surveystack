<template>
  <v-overlay
    :absolute="absolute"
    :contained="contained"
    :location="location"
    :modelValue="modelValue"
    :theme="theme"
    :scrim="scrim">
    <slot />
  </v-overlay>
</template>

<script>
export default {
  props: {
    absolute: { type: Boolean, required: false },
    contained: { type: Boolean, required: false },
    location: { type: String, required: false },
    modelValue: { type: Boolean, required: false },
    theme: { type: String, required: false },
    scrim: { type: [String, Boolean], required: false },
  },
};
</script>
