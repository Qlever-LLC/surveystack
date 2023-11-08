<template>
  <v-tab :disabled="disabled" :value="value">
    <slot />
  </v-tab>
</template>

<script>
export default {
  emits: ['change', 'input'],
  props: {
    //vuetify props
    disabled: { type: Boolean, required: false },
    value: { type: undefined, required: false },
  },
};
</script>
