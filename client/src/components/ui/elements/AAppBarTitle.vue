<template>
  <v-app-bar-title :id="id">
    <slot />
  </v-app-bar-title>
</template>

<script>
export default {
  props: {
    //non vuetify props
    id: { type: String, required: false },
  },
};
</script>
