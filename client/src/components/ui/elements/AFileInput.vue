<template>
  <v-file-input @change="$emit('change', $event)" :label="label" />
</template>

<script>
export default {
  name: 'AFileInput',
  emits: ['change'],
  props: {
    label: { type: String, required: false },
  },
};
</script>
