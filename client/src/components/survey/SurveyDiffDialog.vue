<template>
  <a-dialog :value="value" @input="(v) => $emit('input', v)" width="700" max-width="75%" persistent>
    <a-card>
      <a-card-title>
        Compare
        <a-chip dark small color="green" class="mx-2"> Version {{ revisionA.version }} </a-chip>
        to
        <a-chip dark small color="green" class="mx-2"> Version {{ revisionB.version }} </a-chip>
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
  </a-dialog>
</template>

<script>
import SurveyDiff from '@/components/survey/SurveyDiff';

export default {
  components: {
    SurveyDiff,
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
