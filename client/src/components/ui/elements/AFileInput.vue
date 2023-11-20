<template>
  <v-file-input @change="$emit('change', $event)" :label="label" />
</template>

<script>
export default {
  emits: ['change'],
  props: {
    label: { type: String, required: false },
  },
};
</script>
