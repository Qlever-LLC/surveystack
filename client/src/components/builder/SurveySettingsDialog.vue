<template>
  <v-dialog :value="value" @input="$emit('input', $event)" width="500" max-width="75%">
    <v-card>
      <v-card-title> Print settings </v-card-title>
      <v-card-text>
        <v-checkbox
          v-model="survey.options.showInstruction"
          label="Show Instruction questions in PDF submissions."
          hide-details
        />
        <v-checkbox
          v-model="survey.options.hideUnanswered"
          label="Don't show unanswered questions in PDF submissions."
          hide-details
        />
      </v-card-text>
      <v-card-actions class="mr-3">
        <v-spacer />
        <v-btn @click="$emit('input', false)" color="primary" text> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'print-settings-dialog',
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    survey: {
      type: Object,
      required: true,
    },
  },
};
</script>
