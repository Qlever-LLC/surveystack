<template>
  <a-dialog
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    max-width="800"
    max-height="1000">
    <a-card class="pa-4">
      <FarmOSRegister
        :viewModel="viewModel"
        @check-url="$emit('check-url', $event)"
        @create-instance="$emit('create-instance', $event)" />
    </a-card>
  </a-dialog>
</template>

<script>
import FarmOSRegister from '@/pages/farmos-manage/FarmOSRegister.vue';

export default {
  props: {
    modelValue: Boolean,
    viewModel: {
      type: Object,
      required: true,
    },
  },
  emits: ['check-url', 'create-instance', 'update:modelValue'],
  components: { FarmOSRegister },
};
</script>
