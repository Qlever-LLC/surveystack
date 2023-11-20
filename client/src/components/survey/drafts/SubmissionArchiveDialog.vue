<template>
  <v-dialog v-model="show" :width="width" :max-width="maxWidth" :persistent="persistent">
    <v-card>
      <v-card-title class="headline">
        <slot name="title">{{ title }}</slot>
      </v-card-title>
      <v-card-text>
        <slot name="default"></slot>
        <h3 class="mt-3">Please choose a reason</h3>
        <v-select v-model="archiveReason" :items="availableArchiveReasons" outlined />
        <a-text-field
          v-if="archiveReason === 'OTHER'"
          label="Please specify other reason"
          v-model="archiveReasonOther"
          outlined
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="$emit('cancel')">Cancel</v-btn>
        <v-btn text @click="confirm" color="error">{{ labelConfirm ? labelConfirm : 'OK' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    persistent: Boolean,
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
    reason: {
      type: String,
      default: 'TEST_DATA',
    },
  },

  data() {
    return {
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
