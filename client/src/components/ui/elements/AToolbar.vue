<template>
  <v-toolbar
    :class="{ fullWidth: cssFullWidth, backgroundCream: cssBackgroundCream }"
    :color="color"
    :density="dense ? 'compact' : 'default'"
    :flat="flat">
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
    dense: { type: Boolean, required: false },
    flat: { type: Boolean, required: false },
  },
};
</script>

<style scoped lang="scss">
.fullWidth :deep(.v-toolbar__items) {
  width: 100%;
}
.fullWidth :deep(.v-toolbar__content) {
  padding-left: 4px;
  padding-right: 4px;
  width: 100%;
  display: block;
}

.backgroundCream :deep(.v-toolbar__content) {
  background: #f5f5f5 !important;
}
</style>
