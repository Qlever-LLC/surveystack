<template>
  <v-avatar :color="color" :rounded="rounded" :size="size">
    <slot />
  </v-avatar>
</template>

<script>
export default {
  props: {
    //vuetify props
    color: { type: String, required: false },
    rounded: { type: [Number, String, Boolean], required: false },
    size: { type: [Number, String], required: false },
  },
};
</script>
