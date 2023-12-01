<template>
  <v-navigation-drawer :modelValue="modelValue">
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
  },
};
</script>
