<template>
  <v-btn-toggle :value="value" @change="$emit('input', $event)" :dense="dense">
    <slot />
  </v-btn-toggle>
</template>

<script>
export default {
  name: 'ABtnToggle',
  props: {
    dense: { type: Boolean, required: false },
    value: { type: undefined, required: false },
  },
  emits: ['input'],
};
</script>
