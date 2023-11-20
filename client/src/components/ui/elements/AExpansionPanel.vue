<template>
  <v-expansion-panel :readonly="readonly">
    <slot />
  </v-expansion-panel>
</template>

<script>
export default {
  props: {
    readonly: { type: Boolean, required: false },
  },
};
</script>

<style scoped></style>
