<template>
  <a-dialog v-model="show" :width="width" :max-width="maxWidth" :persistent="persistent">
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
          variant="outlined"
        />
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

  data() {
    return {
      value: this.modelValue,
      archiveReason: this.reason,
      archiveReasonOther: '',
      availableArchiveReasons: ['TEST_DATA', 'INCORRECT_DATA', 'EQUIPMENT_ERROR', 'USER_ERROR', 'RESUBMIT', 'OTHER'],
    };
  },
  methods: {
    confirm() {
      let reason = this.archiveReason;
      if (reason === 'OTHER' && this.archiveReasonOther) {
        reason = this.archiveReasonOther;
      }
      this.$emit('confirm', reason);
      this.$emit('input', false);
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
