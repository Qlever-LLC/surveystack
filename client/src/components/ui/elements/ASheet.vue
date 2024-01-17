<template>
  <v-sheet :border="border" :color="color" :elevation="elevation" :rounded="rounded"> <slot /> </v-sheet>
</template>

<script>
export default {
  name: 'ASheet',
  props: {
    //vuetify props
    border: { type: [Number, String, Boolean], required: false },
    color: { type: String, required: false },
    elevation: { type: [Number, String], required: false },
    rounded: { type: [Boolean, Number, String], required: false },
  },
};
</script>
