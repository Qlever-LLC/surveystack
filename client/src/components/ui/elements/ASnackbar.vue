<template>
  <v-snackbar
    :class="{ snackbar: cssIosSnackbar }"
    :color="color"
    :location="location"
    :modelValue="modelValue"
    :position="position"
    :timeout="timeout"
    @update:modelValue="$emit('update:modelValue', $event)">
    <template v-slot:actions>
      <slot name="actions" />
    </template>
    <slot />
  </v-snackbar>
</template>

<script>
export default {
  emits: ['update:modelValue'],
  props: {
    //non vuetify props
    //TODO test on ios
    cssIosSnackbar: { type: Boolean, required: false },
    //vuetify props
    color: { type: String, required: false },
    location: { type: String, required: false },
    modelValue: { type: undefined, required: false },
    position: { type: String, required: false },
    timeout: { type: [Number, String], required: false },
  },
};
</script>

<style scoped lang="scss">
.snackbar {
  height: auto !important;
}

.snackbar >>> .v-snack__content {
  position: relative;
}

.snackbar >>> .v-snack__content::after {
  content: '';
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-top: 8px solid;
  position: fixed;
  bottom: 0;
  left: 50%;
  margin-left: -12px;
}
</style>
