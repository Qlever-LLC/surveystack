<template>
  <v-dialog :value="value" @input="$emit('input', $event)" width="350" max-width="75%">
    <a-card>
      <a-card-title> Print settings </a-card-title>

      <a-card-text>
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
      </a-card-text>

      <a-card-actions class="mr-3">
        <v-spacer />
        <v-btn @click="$emit('input', false)" color="primary" text> Close </v-btn>
      </a-card-actions>
    </a-card>
  </v-dialog>
</template>

<script>
import Checkbox from '@/components/ui/Checkbox.vue';
import ACard from '@/components/ui/ACard.vue';
import ACardActions from '@/components/ui/ACardActions.vue';
import ACardText from '@/components/ui/ACardText.vue';
import ACardTitle from '@/components/ui/ACardTitle.vue';

export default {
  name: 'survey-print-settings-dialog',
  components: {
    Checkbox,
    ACard,
    ACardActions,
    ACardText,
    ACardTitle,
  },
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
