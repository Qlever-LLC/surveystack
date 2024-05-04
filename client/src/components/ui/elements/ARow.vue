<template>
  <v-row
    :class="{ gap12px: cssGap12px, minHeight96px: cssMinHeight96px, minWidth0px: cssMinWidth0px }"
    :align="align"
    :dense="dense"
    :justify="justify">
    <slot />
  </v-row>
</template>

<script>
export default {
  props: {
    //non vuetify props
    cssGap12px: { type: Boolean, required: false },
    cssMinHeight96px: { type: Boolean, required: false },
    cssMinWidth0px: { type: Boolean, required: false },
    //vuetify props
    align: { type: String, required: false },
    dense: { type: Boolean, required: false },
    justify: { type: String, required: false },
  },
};
</script>

<style scoped lang="scss">
.minWidth0px {
  min-width: 0px;
}

.minHeight96px {
  min-height: 96px;
}

.gap12px {
  gap: 12px;
}
</style>
