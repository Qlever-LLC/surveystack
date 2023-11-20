<template>
  <!--rename to v-expansion-panel-title in v3-->
  <v-expansion-panel-header :expand-icon="expandIcon">
    <slot name="actions" />
    <slot />
  </v-expansion-panel-header>
</template>

<script>
export default {
  props: {
    expandIcon: { type: String, default: '$expand' },
  },
};
</script>

<style scoped></style>
