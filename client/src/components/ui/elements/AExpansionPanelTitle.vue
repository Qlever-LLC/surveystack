<template>
  <v-expansion-panel-title :class="{ transparentOverlay: cssTransparentOverlay }" :expand-icon="expandIcon">
    <slot name="actions" />
    <slot />
  </v-expansion-panel-title>
</template>

<script>
export default {
  name: 'AExpansionPanelTitle',
  props: {
    cssTransparentOverlay: { type: Boolean, required: false },
    expandIcon: { type: String, default: '$expand' },
  },
};
</script>

<style scoped lang="scss">
.transparentOverlay :deep(.v-expansion-panel-title__overlay) {
  background-color: transparent !important;
}
</style>
