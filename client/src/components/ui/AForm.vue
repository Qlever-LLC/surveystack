<template>
  <v-form
    ref="form"
    :model-value="value"
    :disabled="disabled"
    :lazy-validation="lazyValidation"
    :readonly="readOnly"
    @submit="$emit('submit', $event)"
    @input="$emit('input', $event)"
  >
    <template v-slot:default>
      <slot name="default" />
    </template>
  </v-form>
</template>

<script>
export default {
  props: {
    disabled: { type: Boolean, default: false },
    lazyValidation: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
    value: { type: Boolean, default: false },
  },
  setup() {
    function validate() {
      return this.$refs.form.validate();
    }
    function resetValidation() {
      this.$refs.form.resetValidation();
    }
    return {
      validate,
      resetValidation,
    };
  },
};
</script>
