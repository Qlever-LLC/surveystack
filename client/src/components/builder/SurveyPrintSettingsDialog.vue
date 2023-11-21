<template>
  <v-dialog :value="value" @input="$emit('input', $event)" width="350" max-width="75%">
    <v-card>
      <v-card-title> Print settings </v-card-title>

      <v-card-text>
        <div class="d-flex">
          <a-checkbox
            v-model="survey.meta.printOptions.showInstruction"
            label="Show Instructions"
            helper-text="Display instructions questions on PDFs of completed submissions."
            color="grey darken-1"
            class="align-center align-self-start"
          />
        </div>
        <div class="d-flex">
          <a-checkbox
            v-model="survey.meta.printOptions.showUnanswered"
            label="Show Unanswered"
            helper-text='Display unanswered questions on PDFs of completed submissions. Unanswered questions will show "No answer" in the PDF.'
            color="grey darken-1"
            class="align-center align-self-start"
          />
        </div>
      </v-card-text>

      <v-card-actions class="mr-3">
        <a-spacer />
        <v-btn @click="$emit('input', false)" color="primary" text> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import ACheckbox from '@/components/ui/ACheckbox.vue';

export default {
  name: 'survey-print-settings-dialog',
  components: { ACheckbox },
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
