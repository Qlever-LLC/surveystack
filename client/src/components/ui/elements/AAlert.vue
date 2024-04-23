<!-- eslint-disable vue/no-deprecated-dollar-listeners-api -->
<!-- TODO The `$listeners` is deprecated  vue/no-deprecated-dollar-listeners-api -->
<template>
  <v-alert
    @click:close="$emit('click:close')"
    class="mb-2"
    :border="border"
    :color="color"
    :border-color="borderColor"
    :closable="closable"
    :elevation="elevation"
    :icon="icon"
    :mode="mode"
    :prominent="prominent"
    :type="type"
    :variant="variant"
    v-bind="$attrs">
    <template v-slot:default>
      <slot name="default" />
    </template>
  </v-alert>
</template>

<script>
export default {
  emits: ['click:close'],
  props: {
    border: { type: String, required: false },
    color: { type: String, required: false },
    borderColor: { type: String, default: undefined },
    closable: { type: Boolean, default: false },
    elevation: { type: [Number, String], required: false },
    icon: { type: undefined, required: false },
    mode: { type: String, required: false },
    prominent: { type: Boolean, default: false },
    type: { type: String, required: false },
    variant: {
      type: String,
      validator: function (value) {
        return ['flat', 'text', 'elevated', 'tonal', 'outlined', 'plain'].includes(value);
      },
      required: false,
      default: 'flat',
    },
  },
};
</script>
