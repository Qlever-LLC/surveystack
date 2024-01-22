<template>
  <v-form
    ref="form"
    :modelValue="modelValue"
    :disabled="disabled"
    :validate-on="lazyValidation ? 'lazy' : 'input'"
    :readonly="readOnly"
    @submit="$emit('submit', $event)"
    @update:modelValue="$emit('update:modelValue', $event)">
    <template v-slot:default>
      <slot name="default" />
    </template>
  </v-form>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  disabled: { type: Boolean, default: false },
  lazyValidation: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
  modelValue: { type: Boolean, default: false },
});

const form = ref(null);

async function validate() {
  const { valid } = await form.value.validate();
  return valid;
}
function resetValidation() {
  form.value.resetValidation();
}

defineExpose({ validate, resetValidation });
</script>
