<template>
  <v-skeleton-loader :type="type" />
</template>

<script>
export default {
  props: {
    //vuetify props
    type: { type: undefined, required: false },
  },
};
</script>
