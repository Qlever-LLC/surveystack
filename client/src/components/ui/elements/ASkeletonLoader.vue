<template>
  <v-skeleton-loader :type="type" :color="color" :height="height" />
</template>

<script>
export default {
  props: {
    //vuetify props
    type: { type: undefined, required: false },
    color: { type: String, required: false },
    height: { type: Number, required: false },
  },
};
</script>
