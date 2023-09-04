<template>
  <v-list-group :prepend-icon="prependIcon" :value="value" :color="color">
    <slot name="activator" />
  </v-list-group>
</template>

<script>
export default {
  props: {
    prependIcon: { type: String, required: false },
    value: { type: undefined, required: false },
    color: { type: String, required: false },
  },
};
</script>
