<template>
  <!-- v-bind="$attrs" => question_types/Matrix has v-bind="dialogProps" 
  to keep the v-dialog on the matrix box and not full screen -->
  <v-dialog
    v-bind="$attrs"
    @click:outside="$emit('click:outside', $event)"
    @input="$emit('input', $event)"
    :content-class="cssLoginPage ? 'loginPage' : ''"
    :role="role"
    :fullscreen="fullscreen"
    :height="height"
    :hide-overlay="hideOverlay"
    :persistent="persistent"
    :max-height="maxHeight"
    :max-width="maxWidth"
    :scrollable="scrollable"
    :width="width"
    :value="value"
  >
    <template v-slot:activator="{ on, attrs }">
      <slot name="activator" :on="on" :attrs="attrs" />
    </template>
    <slot />
  </v-dialog>
</template>

<script>
export default {
  emits: ['click:outside', 'input'],
  props: {
    //non vuetify props
    cssLoginPage: { type: Boolean, required: false },
    role: { type: String, required: false },
    //vuetify props
    fullscreen: { type: Boolean, required: false },
    height: { type: [String, Number], required: false },
    hideOverlay: { type: Boolean, required: false },
    persistent: { type: Boolean, required: false },
    maxHeight: { type: [String, Number], required: false },
    maxWidth: { type: [String, Number], required: false },
    scrollable: { type: Boolean, required: false },
    width: { type: [String, Number], required: false },
    value: { type: undefined, required: false },
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
