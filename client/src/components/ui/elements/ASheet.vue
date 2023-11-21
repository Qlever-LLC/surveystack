<template>
  <v-sheet :outlined="outlined" :color="color" :elevation="elevation" :rounded="rounded"> <slot /> </v-sheet>
</template>

<script>
export default {
  name: 'ASheet',
  props: {
    //TODO Vuetify 3 change to border type [Number, String, Boolean]
    outlined: { type: Boolean, required: false },
    //vuetify props
    color: { type: String, required: false },
    elevation: { type: [Number, String], required: false },
    rounded: { type: [Boolean, Number, String], required: false },
  },
};
</script>
