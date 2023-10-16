<template>
  <v-dialog v-model="isVisible" persistent width="300">
    <v-card>
      <v-card-title>
        {{ title }}
      </v-card-title>
      <v-card-text>
        <slot />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <a-btn text @click.stop="handleAbort"> Cancel </a-btn>
        <a-btn text color="primary" @click.stop="handleConfirm">
          {{ confirmText }}
        </a-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import api from '@/services/api.service';
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
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
