<template>
  <v-container :class="{ height100: cssHeight100 }" :fill-height="fillHeight" :fluid="fluid">
    <slot />
  </v-container>
</template>

<script>
export default {
  props: {
    cssHeight100: { type: Boolean, required: false },
    fillHeight: { type: Boolean, required: false },
    fluid: { type: Boolean, required: false },
  },
};
</script>

<style scoped>
.height100 {
  height: 100%;
}
</style>
