<template>
  <v-toolbar
    :class="{ fullWidth: cssFullWidth, backgroundCream: cssBackgroundCream }"
    :color="color"
    :dark="dark"
    :dense="dense"
    :flat="flat"
    :tile="tile"
  >
    <slot />
  </v-toolbar>
</template>

<script>
export default {
  props: {
    //non vuetify props
    cssFullWidth: { type: Boolean, required: false },
    cssBackgroundCream: { type: Boolean, required: false },
    //vuetify props
    color: { type: String, required: false },
    dark: { type: Boolean, required: false },
    dense: { type: Boolean, required: false },
    flat: { type: Boolean, required: false },
    tile: { type: Boolean, required: false },
  },
};
</script>

<style scoped>
.fullWidth >>> .v-toolbar__items {
  width: 100%;
}
.fullWidth >>> .v-toolbar__content {
  padding-left: 40px;
  padding-right: 4px;
  width: 100%;
}

.backgroundCream >>> .v-toolbar__content {
  background: #f5f5f5 !important;
}
</style>
