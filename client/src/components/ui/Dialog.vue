<template>
  <a-dialog
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :width="width"
    :max-width="maxWidth"
    :persistent="modal"
    v-bind="$attrs">
    <a-card class="pa-2">
      <a-card-title class="headline">
        <slot name="title">{{ title }}</slot>
      </a-card-title>
      <a-card-text>
        <slot name="default">Default slot content</slot>
      </a-card-text>
      <a-card-actions>
        <a-spacer />
        <a-btn v-if="!hideCancel" @click="$emit('cancel')" class="mr-2">Cancel</a-btn>
        <a-btn color="primary" variant="flat" @click="$emit('confirm')">
          <slot name="iconLeftToConfirm"></slot>
          {{ labelConfirm ? labelConfirm : 'OK' }}
        </a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script>
export default {
  props: {
    modal: {
      type: Boolean,
      default: false,
    },
    modelValue: Boolean,
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
  emits: ['update:modelValue', 'cancel', 'confirm'],
};
</script>
