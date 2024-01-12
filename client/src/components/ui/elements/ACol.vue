<template>
  <v-col :class="{ minWidth0px: cssMinWidth0px }" :align="align" :cols="cols" :lg="lg" :md="md" :sm="sm">
    <slot />
  </v-col>
</template>

<script>
export default {
  props: {
    cssMinWidth0px: { type: Boolean, required: false },
    align: { type: String, required: false },
    cols: { type: [Boolean, String, Number], required: false },
    lg: { type: [Boolean, String, Number], required: false },
    md: { type: [Boolean, String, Number], required: false },
    sm: { type: [Boolean, String, Number], required: false },
  },
};
</script>

<style scoped lang="scss">
.minWidth0px {
  min-width: 0px;
}
</style>
