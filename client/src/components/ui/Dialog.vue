<template>
  <a-dialog v-model="show" :width="width" :max-width="maxWidth" :persistent="modal" v-bind="$attrs">
    <a-card>
      <a-card-title class="headline">
        <slot name="title">{{ title }}</slot>
      </a-card-title>
      <a-card-text>
        <slot name="default">Default slot content</slot>
      </a-card-text>
      <a-card-actions>
        <a-spacer />
        <v-btn v-if="!hideCancel" text @click="$emit('cancel')">Cancel</v-btn>
        <v-btn text @click="$emit('confirm')">{{ labelConfirm ? labelConfirm : 'OK' }}</v-btn>
      </a-card-actions>
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
    modal: {
      type: Boolean,
      default: false,
    },
    value: Boolean,
    labelConfirm: String,
    width: [String, Number],
    title: {
      type: String,
      default: 'Dialog title',
    },
    maxWidth: {
      type: [String, Number],
      default: '',
    },
    hideCancel: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    show: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit('input', value);
      },
    },
  },
};
</script>
