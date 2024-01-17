<template>
  <v-banner :bg-color="bgColor" :rounded="rounded">
    <slot />
  </v-banner>
</template>

<script>
export default {
  props: {
    //vuetify props
    bgColor: { type: String, required: false },
    rounded: { type: [Boolean, String], required: false },
  },
};
</script>
