<template>
  <v-table :fixed-header="fixedHeader" :density="dense ? 'compact' : 'default'" :height="height">
    <template v-slot:default>
      <slot name="default" />
    </template>
  </v-table>
</template>

<script>
export default {
  props: {
    fixedHeader: { type: Boolean, default: false },
    dense: { type: Boolean, default: false },
    height: { type: [Number, String], required: false },
  },
};
</script>
