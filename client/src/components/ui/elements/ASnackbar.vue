<template>
  <v-snackbar
    @input="$emit('input', $event)"
    :class="{ snackbar: cssIosSnackbar }"
    :bottom="bottom"
    :centered="centered"
    :fixed="fixed"
    :color="color"
    :light="light"
    :timeout="timeout"
    :top="top"
    :value="value"
  >
    <template v-slot:action="{ attrs }">
      <slot name="action" :attrs="attrs" />
    </template>
    <slot />
  </v-snackbar>
</template>

<script>
export default {
  emits: ['input'],
  props: {
    //non vuetify props
    cssIosSnackbar: { type: Boolean, required: false },
    //TODO vuetify props that will change with Vuetify 3
    bottom: { type: Boolean, required: false }, //location
    centered: { type: Boolean, required: false }, //location
    fixed: { type: Boolean, required: false }, //position
    top: { type: Boolean, required: false }, //position
    //vuetify props
    light: { type: Boolean, required: false },
    color: { type: String, required: false },
    timeout: { type: [Number, String], required: false },
    value: { type: undefined, required: false },
  },
};
</script>

<style scoped>
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
  border-top: 8px solid var(--v-primary-lighten1);
  position: fixed;
  bottom: 0;
  left: 50%;
  margin-left: -12px;
}
</style>
