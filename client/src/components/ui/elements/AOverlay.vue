<template>
  <v-overlay :absolute="absolute" :light="light" :value="value">
    <slot />
  </v-overlay>
</template>

<script>
export default {
  props: {
    //vuetify props
    absolute: { type: Boolean, required: false },
    light: { type: Boolean, required: false },
    value: { type: undefined, required: false },
  },
};
</script>
