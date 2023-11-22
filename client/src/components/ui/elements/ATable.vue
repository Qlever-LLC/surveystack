<template>
  <v-simple-table :fixed-header="fixedHeader" :dense="dense">
    <template v-slot:default>
      <slot name="default" />
    </template>
  </v-simple-table>
</template>

<script>
export default {
  props: {
    fixedHeader: { type: Boolean, default: false },
    dense: { type: Boolean, default: false },
  },
};
</script>
