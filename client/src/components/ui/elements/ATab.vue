<template>
  <v-tab :href="href" :disabled="disabled" :value="value">
    <slot />
  </v-tab>
</template>

<script>
export default {
  emits: ['change', 'input'],
  props: {
    //non vuetify props
    href: { type: String, required: false },
    //vuetify props
    disabled: { type: Boolean, required: false },
    value: { type: undefined, required: false },
  },
};
</script>
