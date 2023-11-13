<template>
  <v-card-text
    @click="$emit('click', $event)"
    :class="{ maxHeight500px: cssMaxHeight500px, paddingBottom2px: cssPaddingBottom2px }"
    :disabled="disabled"
  >
    <slot />
  </v-card-text>
</template>

<script>
export default {
  emits: ['click'],
  props: {
    //non vuetify props
    cssMaxHeight500px: { type: Boolean, required: false },
    cssPaddingBottom2px: { type: Boolean, required: false },
    disabled: { type: Boolean, required: false },
  },
};
</script>

<style scoped>
.maxHeight500px {
  max-height: 500px;
}

.paddingBottom2px {
  padding-bottom: 2px;
}
</style>
