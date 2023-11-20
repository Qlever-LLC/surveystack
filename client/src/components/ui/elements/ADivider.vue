<template>
  <v-divider :dark="dark" :vertical="vertical" />
</template>

<script>
export default {
  props: {
    dark: { type: Boolean, required: false },
    vertical: { type: Boolean, required: false },
  },
};
</script>
