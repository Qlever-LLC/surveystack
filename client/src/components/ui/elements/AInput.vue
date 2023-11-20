<template>
  <v-input :hide-details="hideDetails">
    <slot />
  </v-input>
</template>

<script>
export default {
  props: {
    hideDetails: { type: [Boolean, String], required: false },
  },
};
</script>
