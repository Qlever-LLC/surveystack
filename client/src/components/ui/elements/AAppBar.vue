<template>
  <v-app-bar :app="app" :absolute="absolute" :clipped-left="clippedLeft" :color="color" :flat="flat">
    <slot />
  </v-app-bar>
</template>

<script>
export default {
  props: {
    //TODO Vuetify 3 update
    app: { type: Boolean, required: false },
    //vuetify props
    absolute: { type: Boolean, required: false },
    clippedLeft: { type: Boolean, required: false },
    color: { type: String, required: false },
    flat: { type: Boolean, required: false },
  },
};
</script>
