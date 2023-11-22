<template>
  <v-timeline :dense="dense"> <slot /> </v-timeline>
</template>

<script>
export default {
  props: {
    // //vuetify props
    dense: { type: Boolean, required: false },
  },
};
</script>
