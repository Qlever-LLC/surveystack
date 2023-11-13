<template>
  <v-dialog :value="value" @input="(v) => $emit('input', v)" hide-overlay persistent width="300">
    <a-card>
      <a-card-text class="pa-4">
        <span>{{ message }}</span>
        <v-progress-linear indeterminate class="mb-0" />
      </a-card-text>
    </a-card>
  </v-dialog>
</template>

<script>
import ACard from '@/components/ui/ACard.vue';
import ACardText from '@/components/ui/ACardText.vue';
export default {
  components: {
    ACard,
    ACardText,
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
