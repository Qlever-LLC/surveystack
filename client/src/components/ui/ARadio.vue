<template>
  <div>
    <v-radio :label="label" :value="value" :color="color">
      <template v-slot:label>
        <slot name="label" />
      </template>
    </v-radio>
  </div>
</template>

<script>
export default {
  props: {
    label: { default: undefined },
    value: { default: undefined },
    color: { default: undefined },
  },
};
</script>
