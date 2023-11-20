<template>
  <v-radio :label="label" :value="value" :color="color" @change="$emit('change', $event)">
    <template v-slot:label>
      <slot name="label" />
    </template>
  </v-radio>
</template>

<script>
export default {
  name: 'ARadio',
  emits: ['change'],
  props: {
    label: { type: String, required: false },
    value: { type: undefined, required: true },
    color: { type: String, required: false },
  },
};
</script>
