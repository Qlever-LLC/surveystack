<template>
  <v-app-bar :absolute="absolute" :color="color" :flat="flat" :scroll-behavior="scrollBehavior">
    <slot />
  </v-app-bar>
</template>

<script>
export default {
  props: {
    //vuetify props
    absolute: { type: Boolean, required: false },
    color: { type: String, required: false },
    flat: { type: Boolean, required: false },
    scrollBehavior: { type: String, required: false },
  },
};
</script>
