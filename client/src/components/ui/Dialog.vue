<template>
  <a-dialog v-model="show" :width="width" :max-width="maxWidth" :persistent="modal" v-bind="$attrs">
    <v-card>
      <v-card-title class="headline">
        <slot name="title">{{ title }}</slot>
      </v-card-title>
      <v-card-text>
        <slot name="default">Default slot content</slot>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn v-if="!hideCancel" text @click="$emit('cancel')">Cancel</v-btn>
        <v-btn text @click="$emit('confirm')">{{ labelConfirm ? labelConfirm : 'OK' }}</v-btn>
      </v-card-actions>
    </v-card>
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
