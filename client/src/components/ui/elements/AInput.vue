<template>
  <v-input :hide-details="hideDetails">
    <slot />
  </v-input>
</template>

<script>
export default {
  name: 'AInput',
  props: {
    hideDetails: { type: [Boolean, String], required: false },
  },
};
</script>
