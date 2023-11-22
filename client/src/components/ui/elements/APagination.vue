<template>
  <v-pagination @input="$emit('input', $event)" :color="color" :length="length" :value="value" />
</template>

<script>
export default {
  emits: ['input'],
  props: {
    //vuetify props
    color: { type: String, required: false },
    length: { type: Number, required: false },
    value: { type: undefined, required: false },
  },
};
</script>
