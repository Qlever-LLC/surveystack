<template>
  <v-container :class="{ height100: cssHeight100, displayCenterOfPage: cssDisplayCenterOfPage }" :fluid="fluid">
    <slot />
  </v-container>
</template>

<script>
export default {
  props: {
    cssDisplayCenterOfPage: { type: Boolean, required: false },
    cssHeight100: { type: Boolean, required: false },
    fluid: { type: Boolean, required: false },
  },
};
</script>

<style scoped lang="scss">
.displayCenterOfPage {
  display: flex;
  justify-content: center;
  align-items: center;
}
.height100 {
  height: 100%;
}
</style>
