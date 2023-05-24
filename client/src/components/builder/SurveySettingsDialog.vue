<template>
  <v-dialog :value="value" @input="$emit('input', $event)" width="350" max-width="75%">
    <v-card>
      <v-card-title> Print settings </v-card-title>

      <v-card-text>
        <div class="d-flex">
          <checkbox
            v-model="survey.options.showInstruction"
            label="Show Instructions"
            helper-text="Display instructions question on PDFs of completed submissions."
          />
        </div>
        <div class="d-flex">
          <checkbox
            v-model="survey.options.showUnanswered"
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
  </v-dialog>
</template>

<script>
import Checkbox from '@/components/ui/Checkbox.vue';

export default {
  name: 'print-settings-dialog',
  components: { Checkbox },
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
  created() {
    if (typeof this.survey.options === 'undefined') {
      this.$set(this.survey, 'options', {
        showInstruction: true,
        showUnanswered: false,
      });
    } else {
      if (typeof this.survey.options.showInstruction === 'undefined') {
        this.$set(this.survey.options, 'showInstruction', true);
      }
      if (typeof this.survey.options.showUnanswered === 'undefined') {
        this.$set(this.survey.options, 'showUnanswered', false);
      }
    }
  },
};
</script>
