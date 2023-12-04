<template>
  <a-dialog :value="value" @input="$emit('input', $event)" width="350" max-width="75%">
    <a-card>
      <a-card-title> Print settings </a-card-title>

      <a-card-text>
        <div class="d-flex">
          <a-checkbox
            v-model="survey.meta.printOptions.showInstruction"
            label="Show Instructions"
            helper-text="Display instructions questions on PDFs of completed submissions."
            color="grey-darken-1"
            class="align-center align-self-start"
          />
        </div>
        <div class="d-flex">
          <a-checkbox
            v-model="survey.meta.printOptions.showUnanswered"
            label="Show Unanswered"
            helper-text='Display unanswered questions on PDFs of completed submissions. Unanswered questions will show "No answer" in the PDF.'
            color="grey-darken-1"
            class="align-center align-self-start"
          />
        </div>
      </a-card-text>

      <a-card-actions class="mr-3">
        <a-spacer />
        <a-btn @click="$emit('input', false)" color="primary" text> Close </a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script>
export default {
  name: 'survey-print-settings-dialog',
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
