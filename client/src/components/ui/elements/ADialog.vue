<template>
  <!-- v-bind="$attrs" => question_types/Matrix has v-bind="dialogProps"
  to keep the v-dialog on the matrix box and not full screen -->
  <v-dialog
    v-bind="$attrs"
    @click:outside="$emit('click:outside', $event)"
    @update:modelValue="$emit('update:modelValue', $event)"
    :content-class="cssLoginPage ? 'loginPage' : ''"
    :role="role"
    :fullscreen="fullscreen"
    :height="height"
    :persistent="persistent"
    :max-height="maxHeight"
    :max-width="maxWidth"
    :modelValue="modelValue"
    :scrollable="scrollable"
    :width="width">
    <template v-slot:activator="{ props }">
      <slot name="activator" :props="props" />
    </template>
    <slot />
  </v-dialog>
</template>

<script>
export default {
  emits: ['click:outside', 'update:modelValue'],
  props: {
    //non vuetify props
    cssLoginPage: { type: Boolean, required: false },
    role: { type: String, required: false },
    //vuetify props
    fullscreen: { type: Boolean, required: false },
    height: { type: [String, Number], required: false },
    maxHeight: { type: [String, Number], required: false },
    maxWidth: { type: [String, Number], required: false },
    modelValue: { type: undefined, required: false },
    persistent: { type: Boolean, required: false },
    scrollable: { type: Boolean, required: false },
    width: { type: [String, Number], required: false },
  },
};
</script>

<style>
.loginPage {
  height: auto;
  width: auto !important;
  max-width: 40rem;
}
</style>
