<template>
  <v-dialog v-model="show" :width="width" :max-width="maxWidth" :persistent="modal" v-bind="$attrs">
    <v-card>
      <v-card-title class="headline">
        <slot name="title">{{ title }}</slot>
      </v-card-title>
      <v-card-text>
        <slot name="default">Default slot content</slot>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <a-btn v-if="!hideCancel" text @click="$emit('cancel')">Cancel</a-btn>
        <a-btn text @click="$emit('confirm')">{{ labelConfirm ? labelConfirm : 'OK' }}</a-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
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
