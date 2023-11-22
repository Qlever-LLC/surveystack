<template>
  <v-dialog v-model="isVisible" persistent width="300">
    <a-card>
      <a-card-title>
        {{ title }}
      </a-card-title>
      <a-card-text>
        <slot />
      </a-card-text>
      <a-card-actions>
        <a-spacer />
        <v-btn text @click.stop="handleAbort"> Cancel </v-btn>
        <v-btn text color="primary" @click.stop="handleConfirm">
          {{ confirmText }}
        </v-btn>
      </a-card-actions>
    </a-card>
  </v-dialog>
</template>

<script>
import api from '@/services/api.service';
import ACard from '@/components/ui/ACard.vue';
import ACardActions from '@/components/ui/ACardActions.vue';
import ACardText from '@/components/ui/ACardText.vue';
import ACardTitle from '@/components/ui/ACardTitle.vue';

export default {
  components: {
    ACard,
    ACardActions,
    ACardText,
    ACardTitle,
  },
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
