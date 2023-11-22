<template>
  <v-toolbar-items :color="color">
    <slot />
  </v-toolbar-items>
</template>

<script>
export default {
  props: {
    //vuetify props
    color: { type: String, required: false },
  },
};
</script>
