<template>
  <v-chip
    @click="$emit('click', $event)"
    @click:close="$emit('click:close', $event)"
    :closable="closable"
    :color="color"
    :input-value="inputValue"
    :label="label"
    :size="xSmall ? 'x-small' : small ? 'small' : large ? 'large' : xLarge ? 'x-large' : 'default'"
    :variant="variant"
    :title="title">
    <slot />
  </v-chip>
</template>

<script>
export default {
  name: 'AChip',
  emits: ['click', 'click:close'],
  props: {
    //vuetify props
    closable: { type: Boolean, required: false },
    color: { type: String, required: false },
    inputValue: { type: undefined, required: false },
    label: { type: Boolean, required: false },
    xSmall: { type: Boolean, required: false },
    small: { type: Boolean, required: false },
    large: { type: Boolean, required: false },
    xLarge: { type: Boolean, required: false },
    title: { type: String, required: false },
    variant: {
      type: String,
      validator: function (value) {
        return ['flat', 'text', 'elevated', 'tonal', 'outlined', 'plain'].includes(value);
      },
      required: false,
      default: 'tonal',
    },
  },
};
</script>
