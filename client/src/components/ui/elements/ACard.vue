<!-- eslint-disable vue/no-deprecated-dollar-listeners-api -->
<!-- TODO The `$listeners` is deprecated  vue/no-deprecated-dollar-listeners-api -->
<template>
  <v-card
    v-bind="$attrs"
    @mousedown.stop.left="$emit('mousedown.stop.left')"
    :class="{ height90vh: cssHeight90vh }"
    :data-control-contains-page="dataControlContainsPage"
    :data-control-type="dataControlType"
    :data-testid="dataTestid"
    :color="color"
    :elevation="elevation"
    :height="height"
    :loading="loading"
    :min-height="minHeight"
    :min-width="minWidth"
    :theme="theme"
    :variant="variant"
    :width="width"
  >
    <slot />
  </v-card>
</template>

<script>
export default {
  emits: ['mousedown.stop.left'],
  props: {
    //non vuetify props
    cssHeight90vh: { type: Boolean, required: false },
    dataControlContainsPage: { type: undefined, required: false },
    dataControlType: { type: undefined, required: false },
    dataTestid: { type: undefined, required: false },
    //vuetify props
    color: { type: String, required: false },
    elevation: { type: [Number, String], required: false },
    height: { type: [Number, String], required: false },
    loading: { type: [Boolean, String], required: false },
    minHeight: { type: [Number, String], required: false },
    minWidth: { type: [Number, String], required: false },
    //TODO check if we want to allow changing theme on component level
    theme: {
      type: String,
      validator: function (value) {
        return ['dark', 'light'].includes(value);
      },
      required: false,
    },
    variant: {
      type: String,
      validator: function (value) {
        return ['text', 'flat', 'elevated', 'tonal', 'outlined', 'plain'].includes(value);
      },
      default: 'elevated',
      required: false,
    },
    width: { type: [Number, String], required: false },
  },
};
</script>

<style scoped>
.height90vh {
  height: 90vh;
}
</style>
