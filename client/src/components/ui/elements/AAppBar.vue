<template>
  <v-app-bar :absolute="absolute" :color="color" :flat="flat">
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
  },
};
</script>
