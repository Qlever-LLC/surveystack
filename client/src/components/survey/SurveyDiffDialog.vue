<template>
  <a-dialog
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    width="700"
    max-width="75%"
    persistent>
    <a-card>
      <a-card-title>
        Compare
        <a-chip small color="green" class="mx-2"> Version {{ revisionA.version }} </a-chip>
        to
        <a-chip small color="green" class="mx-2"> Version {{ revisionB.version }} </a-chip>
      </a-card-title>
      <survey-diff
        :controls-remote-revision-old="revisionA.controls"
        :controls-remote-revision-new="revisionB.controls"
        :version-name-remote-revision-old="`Version ${revisionA.version}`"
        :version-name-remote-revision-new="`Version ${revisionB.version}`"
        :default-open="true"
        :showHeader="true"
        :showNoChangesText="false"></survey-diff>
      <a-card-actions class="mr-3">
        <a-btn @click="$emit('cancel')" color="primary" variant="text"> Cancel</a-btn>
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
    modelValue: {
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
  emits: ['update:modelValue', 'cancel'],
};
</script>
