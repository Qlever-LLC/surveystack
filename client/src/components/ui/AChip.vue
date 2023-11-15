<template>
  <v-chip
    @click="$emit('click', $event)"
    @click:close="$emit('click:close', $event)"
    v-on="$listeners"
    :close="close"
    :color="color"
    :dark="dark"
    :input-value="inputValue"
    :label="label"
    :outlined="outlined"
    :small="small"
    :title="title"
  >
    <slot />
  </v-chip>
</template>

<script>
export default {
  emits: ['click', 'click:close'],
  props: {
    //vuetify props
    close: { type: Boolean, required: false },
    color: { type: String, required: false },
    dark: { type: Boolean, required: false },
    inputValue: { type: undefined, required: false },
    label: { type: Boolean, required: false },
    outlined: { type: Boolean, required: false },
    small: { type: Boolean, required: false },
    title: { type: String, required: false },
  },
};
</script>
