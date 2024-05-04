<template>
  <v-divider :vertical="vertical" />
</template>

<script>
export default {
  name: 'ADivider',
  props: {
    vertical: { type: Boolean, required: false },
  },
};
</script>
