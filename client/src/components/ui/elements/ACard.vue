<!-- eslint-disable vue/no-deprecated-dollar-listeners-api -->
<!-- TODO The `$listeners` is deprecated  vue/no-deprecated-dollar-listeners-api -->
<template>
  <v-card
    v-on="$listeners"
    v-bind="$attrs"
    @mousedown.stop.left="$emit('mousedown.stop.left')"
    :class="{ height90vh: cssHeight90vh }"
    :data-control-contains-page="dataControlContainsPage"
    :data-control-type="dataControlType"
    :data-testid="dataTestid"
    :dark="dark"
    :color="color"
    :elevation="elevation"
    :flat="flat"
    :height="height"
    :light="light"
    :loading="loading"
    :min-height="minHeight"
    :min-width="minWidth"
    :outlined="outlined"
    :width="width"
  >
    <slot />
  </v-card>
</template>

<script>
export default {
  emits: ['mousedown.stop.left'],
  props: {
    //TODO vuetify 3
    dark: { type: Boolean, required: false },
    //non vuetify props
    cssHeight90vh: { type: Boolean, required: false },
    dataControlContainsPage: { type: undefined, required: false },
    dataControlType: { type: undefined, required: false },
    dataTestid: { type: undefined, required: false },
    //vuetify props
    color: { type: String, required: false },
    elevation: { type: [Number, String], required: false },
    flat: { type: Boolean, required: false },
    height: { type: [Number, String], required: false },
    light: { type: Boolean, required: false },
    loading: { type: [Boolean, String], required: false },
    minHeight: { type: [Number, String], required: false },
    minWidth: { type: [Number, String], required: false },
    outlined: { type: Boolean, required: false },
    width: { type: [Number, String], required: false },
  },
};
</script>

<style scoped>
.height90vh {
  height: 90vh;
}
</style>
