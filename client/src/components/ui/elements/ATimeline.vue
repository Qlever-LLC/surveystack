<template>
  <v-timeline :density="dense ? 'compact' : 'default'"> <slot /> </v-timeline>
</template>

<script>
export default {
  props: {
    // //vuetify props
    dense: { type: Boolean, required: false },
  },
};
</script>
