<template>
  <a-dialog :modelValue="modelValue" @input="(v) => $emit('input', v)" persistent width="300">
    <a-card>
      <a-card-text class="pa-4">
        <span>{{ message }}</span>
        <a-progress-linear indeterminate class="mb-0" />
      </a-card-text>
    </a-card>
  </a-dialog>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    message: {
      type: String,
      default: 'Submitting Draft',
    },
  },
};
</script>
