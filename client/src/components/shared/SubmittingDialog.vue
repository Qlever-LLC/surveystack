<template>
  <v-dialog :value="value" @input="(v) => $emit('input', v)" hide-overlay persistent width="300">
    <v-card>
      <v-card-text class="pa-4">
        <span>{{ message }}</span>
        <a-progress-linear indeterminate class="mb-0" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import AProgressLinear from '@/components/ui/AProgressLinear.vue';
export default {
  components: {
    AProgressLinear,
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
