<template>
  <v-tab :href="href" :disabled="disabled" :value="value">
    <slot />
  </v-tab>
</template>

<script>
export default {
  props: {
    //vuetify props
    disabled: { type: Boolean, required: false },
    href: { type: String, required: false },
    value: { type: undefined, required: false },
  },
};
</script>
