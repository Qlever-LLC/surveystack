<template>
  <a-dialog
    :modelValue="props.modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    @click:outside="emit('close')"
    :max-width="maxWidth ? maxWidth : mobile ? '100%' : '75%'"
    :persistent="modal"
    :scrollable="scrollable"
    :height="height"
    :width="width"
    v-bind="$attrs">
    <a-card class="my-2" color="background">
      <a-card-title class="mt-4 d-flex align-start justify-space-between" style="white-space: pre-wrap">
        <slot name="title"></slot>
        <a-btn @click="emit('close')" variant="flat" color="background"><a-icon>mdi-close</a-icon></a-btn>
      </a-card-title>
      <a-card-subtitle v-if="$slots.subtitle">
        <slot name="subtitle"></slot>
      </a-card-subtitle>
      <a-card-text :class="{ revertOverflow: textRevertOverflow }">
        <slot name="text"></slot>
      </a-card-text>
      <slot name="more"></slot>
      <a-card-actions v-if="$slots.actions">
        <slot name="actions"></slot>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script setup>
import { useDisplay } from 'vuetify';

const { mobile } = useDisplay();

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  scrollable: { type: Boolean, default: false },
  modal: {
    type: Boolean,
    default: false,
  },
  maxWidth: {
    type: [String, Number],
  },
  height: String,
  width: String,
  textRevertOverflow: Boolean,
});

const emit = defineEmits(['update:modelValue', 'close']);
</script>

<style>
.revertOverflow {
  overflow: revert !important;
  padding-bottom: 0px !important;
}
</style>
