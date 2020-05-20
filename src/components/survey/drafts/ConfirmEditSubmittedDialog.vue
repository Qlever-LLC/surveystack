<template>
  <v-dialog
    :value="value"
    @input="(v) => $emit('input', v)"
    width="300"
    persistent
  >
    <v-card>
      <v-card-title>
        Confirm Edit Submission
      </v-card-title>
      <v-card-text >
        This draft has previously been submitted. Are you sure you want to edit it?
        Submitting again will archive the original submission.
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          @click.stop="handleAbort"
        >
          Cancel
        </v-btn>
        <v-btn
          text
          color="error"
          @click.stop="handleConfirm"
        >
          Edit Anyway
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      required: true,
    },
  },
  methods: {
    handleAbort() {
      this.$emit('input', false);
      this.$emit('abort');
    },
    handleConfirm() {
      this.$emit('input', false);
    },
  },
};
</script>

<style>

</style>
