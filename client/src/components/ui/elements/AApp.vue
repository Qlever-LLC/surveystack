<template>
  <v-app :id="id">
    <slot />
  </v-app>
</template>

<script>
export default {
  props: {
    //vuetify props
    id: { type: String, required: false },
  },
};
</script>
