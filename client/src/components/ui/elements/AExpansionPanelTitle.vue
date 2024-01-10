<template>
  <v-expansion-panel-title :expand-icon="expandIcon">
    <slot name="actions" />
    <slot />
  </v-expansion-panel-title>
</template>

<script>
export default {
  name: 'AExpansionPanelTitle',
  props: {
    expandIcon: { type: String, default: '$expand' },
  },
};
</script>

<style scoped lang="scss"></style>
