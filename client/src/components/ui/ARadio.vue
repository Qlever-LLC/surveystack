<script>
export default {
  props: {
    label: { type: String, default: undefined },
    value: { type: String, default: undefined },
    color: { type: String, default: undefined },
  },
  setup() {},
};
</script>

<template>
  <div>
    <v-radio :label="label" :value="value" :color="color">
      <template v-slot:label>
        <slot name="label"></slot>
      </template>
    </v-radio>
  </div>
</template>
