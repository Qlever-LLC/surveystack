<template>
  <a-dialog :value="value" @input="(v) => $emit('input', v)" hide-overlay persistent width="300">
    <a-card>
      <a-card-text class="pa-4">
        <span>{{ message }}</span>
        <a-progress-linear indeterminate class="mb-0" />
      </a-card-text>
    </a-card>
  </a-dialog>
</template>

<script>
import ADialog from '@/components/ui/ADialog.vue';

export default {
  components: {
    ADialog,
  },
  props: {
    value: {
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
