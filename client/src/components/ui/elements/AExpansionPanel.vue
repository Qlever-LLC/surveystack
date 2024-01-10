<template>
  <v-expansion-panel :readonly="readonly">
    <slot />
  </v-expansion-panel>
</template>

<script>
export default {
  name: 'AExpansionPanel',
  props: {
    readonly: { type: Boolean, required: false },
  },
};
</script>

<style scoped lang="scss"></style>
