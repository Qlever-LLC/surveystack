<template>
  <a-dialog :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" persistent width="300">
    <a-card>
      <a-card-text class="pa-4">
        <span>{{ message }}</span>
        <a-progress-linear class="mb-0" />
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
  emits: ['update:modelValue'],
};
</script>
