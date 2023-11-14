<template>
  <v-dialog :value="value" @input="(v) => $emit('input', v)" width="700" max-width="75%" persistent>
    <a-card>
      <a-card-title>
        Compare
        <v-chip dark small color="green" class="mx-2"> Version {{ revisionA.version }} </v-chip>
        to
        <v-chip dark small color="green" class="mx-2"> Version {{ revisionB.version }} </v-chip>
      </a-card-title>
      <survey-diff
        :controls-remote-revision-old="revisionA.controls"
        :controls-remote-revision-new="revisionB.controls"
        :version-name-remote-revision-old="`Version ${revisionA.version}`"
        :version-name-remote-revision-new="`Version ${revisionB.version}`"
        :default-open="true"
        :showHeader="true"
        :showNoChangesText="false"
      ></survey-diff>
      <a-card-actions class="mr-3">
        <v-btn @click="$emit('cancel')" color="primary" text> Cancel</v-btn>
      </a-card-actions>
    </a-card>
  </v-dialog>
</template>

<script>
import SurveyDiff from '@/components/survey/SurveyDiff';
import ACard from '@/components/ui/ACard.vue';
import ACardActions from '@/components/ui/ACardActions.vue';
import ACardTitle from '@/components/ui/ACardTitle.vue';

export default {
  components: {
    SurveyDiff,
    ACard,
    ACardActions,
    ACardTitle,
  },
  props: {
    value: {
      required: true,
      type: Boolean,
    },
    revisionA: {
      type: Object,
      required: true,
    },
    revisionB: {
      type: Object,
      required: true,
    },
  },
  emits: ['cancel'],
};
</script>
