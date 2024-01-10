<template>
  <v-list-subheader :class="{ sticky: cssSticky }"> <slot /> </v-list-subheader>
</template>

<script>
export default {
  props: {
    //non vuetify props
    cssSticky: { type: Boolean, required: false },
  },
};
</script>

<style scoped lang="scss">
.sticky {
  position: sticky;
  top: 0;
  background: white;
  border-bottom: 2px solid #ddd;
  font-weight: 600;
  font-size: 1rem;
  z-index: 1;
}
</style>
