<template>
  <a-dialog
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :width="width"
    :max-width="maxWidth"
    :persistent="persistent">
    <a-card>
      <a-card-title class="headline">
        <slot name="title">{{ title }}</slot>
      </a-card-title>
      <a-card-text>
        <slot name="default"></slot>
        <h3 class="mt-3">Please choose a reason</h3>
        <a-select v-model="archiveReason" :items="availableArchiveReasons" variant="outlined" />
        <a-text-field
          v-if="archiveReason === 'OTHER'"
          label="Please specify other reason"
          v-model="archiveReasonOther"
          variant="outlined" />
      </a-card-text>
      <a-card-actions>
        <a-spacer />
        <a-btn variant="text" @click="$emit('cancel')">Cancel</a-btn>
        <a-btn variant="text" @click="confirm" color="error">{{ labelConfirm ? labelConfirm : 'OK' }}</a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script>
import { ARCHIVE_REASONS } from '@/constants';

export default {
  props: {
    persistent: Boolean,
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
    reason: {
      type: String,
      default: 'TEST_DATA',
    },
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  data() {
    return {
      archiveReason: this.reason,
      archiveReasonOther: '',
      availableArchiveReasons: ARCHIVE_REASONS,
    };
  },
  methods: {
    confirm() {
      let reason = this.archiveReason;
      if (reason === 'OTHER' && this.archiveReasonOther) {
        reason = this.archiveReasonOther;
      }
      this.$emit('confirm', reason);
      this.$emit('update:modelValue', false);
    },
  },
};
</script>
