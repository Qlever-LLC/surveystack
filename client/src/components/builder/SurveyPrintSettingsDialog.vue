<template>
  <a-dialog :value="value" @input="$emit('input', $event)" width="350" max-width="75%">
    <v-card>
      <v-card-title> Print settings </v-card-title>

      <v-card-text>
        <div class="d-flex">
          <checkbox
            v-model="survey.meta.printOptions.showInstruction"
            label="Show Instructions"
            helper-text="Display instructions questions on PDFs of completed submissions."
          />
        </div>
        <div class="d-flex">
          <checkbox
            v-model="survey.meta.printOptions.showUnanswered"
            label="Show Unanswered"
            helper-text='Display unanswered questions on PDFs of completed submissions. Unanswered questions will show "No answer" in the PDF.'
          />
        </div>
      </v-card-text>

      <v-card-actions class="mr-3">
        <v-spacer />
        <v-btn @click="$emit('input', false)" color="primary" text> Close </v-btn>
      </v-card-actions>
    </v-card>
  </a-dialog>
</template>

<script>
import Checkbox from '@/components/ui/Checkbox.vue';
import ADialog from '@/components/ui/ADialog.vue';

export default {
  name: 'survey-print-settings-dialog',
  components: { Checkbox, ADialog },
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
