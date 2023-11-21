<template>
  <v-list-group :prepend-icon="prependIcon" :value="value" :color="color">
    <template v-slot:activator>
      <slot name="activator" />
    </template>
    <slot />
  </v-list-group>
</template>

<script>
export default {
  name: 'AListGroup',
  props: {
    prependIcon: { type: String, required: false },
    value: { type: undefined, required: false },
    color: { type: String, required: false },
  },
};
</script>
