<template>
  <div>
    <v-list :flat="flat" :dense="dense" :two-line="twoLine" :subheader="subheader" :max-width="maxWidth">
      <slot />
    </v-list>
  </div>
</template>

<script>
export default {
  props: {
    flat: { type: Boolean, required: false },
    dense: { type: Boolean, required: false },
    twoLine: { type: Boolean, required: false },
    subheader: { type: Boolean, required: false },
    maxWidth: { type: [Number, String], required: false },
  },
};
</script>
