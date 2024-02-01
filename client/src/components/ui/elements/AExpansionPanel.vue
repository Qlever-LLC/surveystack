<template>
  <v-expansion-panel :elevation="elevation" :readonly="readonly">
    <slot />
  </v-expansion-panel>
</template>

<script>
export default {
  name: 'AExpansionPanel',
  props: {
    elevation: { type: [String, Number], required: false },
    readonly: { type: Boolean, required: false },
  },
};
</script>

<style scoped lang="scss"></style>
