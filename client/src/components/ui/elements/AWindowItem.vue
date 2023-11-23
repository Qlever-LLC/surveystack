<template>
  <v-window-item :value="value">
    <slot />
  </v-window-item>
</template>

<script>
export default {
  props: {
    value: { type: undefined, required: false },
  },
};
</script>
