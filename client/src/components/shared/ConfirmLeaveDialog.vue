<template>
  <a-dialog v-model="isVisible" persistent width="300">
    <a-card>
      <a-card-title>
        {{ title }}
      </a-card-title>
      <a-card-text>
        <slot />
      </a-card-text>
      <a-card-actions>
        <a-spacer />
        <a-btn variant="text" @click.stop="handleAbort"> Cancel </a-btn>
        <a-btn variant="text" color="primary" @click.stop="handleConfirm">
          {{ confirmText }}
        </a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script>
import api from '@/services/api.service';

export default {
  data() {
    return {
      isVisible: false,
      resolve: null,
      next: null,
    };
  },
  props: {
    title: {
      type: String,
      default: 'Confirm Leave',
    },
    confirmText: {
      type: String,
      default: 'Exit',
    },
  },
  methods: {
    open(next) {
      this.isVisible = true;
      this.next = next;
    },
    handleConfirm() {
      api.removeHeader('x-delegate-to');
      this.isVisible = false;
      this.next(true);
    },
    handleAbort() {
      this.isVisible = false;
      this.next(false);
    },
  },
};
</script>
