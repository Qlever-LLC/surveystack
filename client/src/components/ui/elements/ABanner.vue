<template>
  <v-banner :color="color" :dark="dark" :rounded="rounded">
    <slot />
  </v-banner>
</template>

<script>
export default {
  props: {
    //vuetify props
    color: { type: String, required: false },
    dark: { type: Boolean, required: false },
    rounded: { type: [Boolean, String], required: false },
  },
};
</script>
