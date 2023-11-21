<template>
  <v-toolbar-title :id="id">
    <slot />
  </v-toolbar-title>
</template>

<script>
export default {
  props: {
    //non vuetify props
    id: { type: String, required: false },
  },
};
</script>
