<template>
  <v-layout
    :align-center="alignCenter"
    :column="column"
    :justify-center="justifyCenter"
    :text-center="textCenter"
    :wrap="wrap"
  >
    <slot />
  </v-layout>
</template>

<script>
export default {
  props: {
    alignCenter: { type: Boolean, required: false },
    column: { type: Boolean, required: false },
    justifycenter: { type: Boolean, required: false },
    textCenter: { type: Boolean, required: false },
    wrap: { type: Boolean, required: false },
  },
};
</script>
