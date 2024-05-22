<template>
  <v-navigation-drawer
    :modelValue="modelValue"
    :permanent="permanent"
    :sticky="sticky"
    :floating="floating"
    :width="width"
    class="topMarginMobile">
    <slot />
    <template v-slot:append>
      <slot name="append" />
    </template>
  </v-navigation-drawer>
</template>

<script>
export default {
  props: {
    //vuetify props
    modelValue: { type: undefined, required: false },
    permanent: { type: Boolean, required: false },
    sticky: { type: Boolean, required: false },
    floating: { type: Boolean, required: false },
    width: { type: Number, required: false },
  },
};
</script>

<style lang="scss" scoped>
@media (max-width: 960px) {
  .topMarginMobile {
    top: 128px !important;
    height: calc(100% - 128px) !important;
    padding-top: 0px !important;
  }
}
</style>
