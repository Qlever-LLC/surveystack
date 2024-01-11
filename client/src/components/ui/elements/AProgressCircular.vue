<template>
  <v-progress-circular :color="color" :indeterminate="indeterminate" :size="size" :width="width" />
</template>

<script>
export default {
  props: {
    color: { type: String, required: false, default: 'primary' },
    indeterminate: { type: [Boolean, String], required: false, default: 'disable-shrink' },
    size: { type: [Number, String], required: false },
    width: { type: [Number, String], required: false },
  },
};
</script>
