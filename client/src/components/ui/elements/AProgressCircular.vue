<template>
  <v-progress-circular :color="color" :indeterminate="indeterminate" :size="size" :width="width" />
</template>

<script>
export default {
  props: {
    color: { type: String, required: false },
    indeterminate: { type: Boolean, required: false },
    size: { type: [Number, String], required: false },
    width: { type: [Number, String], required: false },
  },
};
</script>
