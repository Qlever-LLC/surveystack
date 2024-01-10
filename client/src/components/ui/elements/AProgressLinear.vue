<template>
  <v-progress-linear :indeterminate="indeterminate" :rounded="rounded" :height="height" />
</template>

<script>
export default {
  props: {
    indeterminate: { type: Boolean, required: false, default: true },
    rounded: { type: Boolean, required: false },
    height: { type: [Number, String], required: false },
  },
};
</script>
