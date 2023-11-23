<template>
  <v-avatar :size="size">
    <slot />
  </v-avatar>
</template>

<script>
export default {
  props: {
    //vuetify props
    size: { type: [Number, String], required: false },
  },
};
</script>
