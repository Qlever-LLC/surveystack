<template>
  <v-navigation-drawer :app="app" :value="value">
    <slot />
  </v-navigation-drawer>
</template>

<script>
export default {
  props: {
    //vuetify props
    app: { type: Boolean, required: false },
    value: { type: undefined, required: false },
  },
};
</script>
