<template>
  <a-dialog
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    width="350"
    max-width="75%">
    <a-card>
      <a-card-title> Print settings </a-card-title>

      <a-card-text>
        <div class="d-flex">
          <a-checkbox
            v-model="survey.meta.printOptions.showInstruction"
            label="Show Instructions"
            helper-text="Display instructions questions on PDFs of completed submissions."
            color="grey-darken-1"
            class="align-center align-self-start" />
        </div>
        <div class="d-flex">
          <a-checkbox
            v-model="survey.meta.printOptions.showUnanswered"
            label="Show Unanswered"
            helper-text='Display unanswered questions on PDFs of completed submissions. Unanswered questions will show "No answer" in the PDF.'
            color="grey-darken-1"
            class="align-center align-self-start" />
        </div>
      </a-card-text>

      <a-card-actions class="mr-3">
        <a-spacer />
        <a-btn @click="$emit('update:modelValue', false)" color="primary" variant="text"> Close </a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script>
export default {
  name: 'survey-print-settings-dialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    survey: {
      type: Object,
      required: true,
    },
  },
  emits: ['update:modelValue'],
};
</script>
