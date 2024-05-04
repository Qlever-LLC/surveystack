<template>
  <v-radio :label="label" :value="value" :color="color">
    <template v-if="labelSlot" v-slot:label>
      <slot name="label" />
    </template>
  </v-radio>
</template>

<script>
export default {
  name: 'ARadio',
  props: {
    labelSlot: { type: Boolean, required: false },
    label: { type: String, required: false },
    value: { type: undefined, required: true },
    color: { type: String, required: false },
  },
};
</script>
