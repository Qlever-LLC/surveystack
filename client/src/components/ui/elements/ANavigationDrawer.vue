<template>
  <v-navigation-drawer
    touchless
    :modelValue="modelValue"
    :permanent="permanent"
    :sticky="sticky"
    :floating="floating"
    :width="width">
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
