<template>
  <div>
    <survey-diff-card
      class="control-item mb-2"
      v-for="(diffInfo, idx) in diffInfoTree"
      :diffInfo="diffInfo"
      :key="`${diffInfo.indexPath}-${diffInfo.changeType}`"
      v-bind="{
        versionNameLocalRevision,
        versionNameRemoteRevisionOld,
        versionNameRemoteRevisionNew,
      }"
      @diff-info-changed="diffInfoChanged($event, idx)"
    >
      <survey-diff-card-tree
        :diffInfoTree="diffInfo.children"
        v-bind="{
          versionNameLocalRevision,
          versionNameRemoteRevisionOld,
          versionNameRemoteRevisionNew,
        }"
        @diff-info-changed="diffInfoChanged($event, idx)"
      />
    </survey-diff-card>
  </div>
</template>

<script>
import SurveyDiffCard from './SurveyDiffCard.vue';
import { changeType } from '@/utils/surveyDiff';

export default {
  name: 'survey-diff-card-tree',
  components: {
    SurveyDiffCard,
  },
  props: {
    diffInfoTree: {
      type: Array,
      required: true,
    },
    versionNameLocalRevision: {
      type: String,
      required: false,
    },
    versionNameRemoteRevisionOld: {
      type: String,
      required: true,
    },
    versionNameRemoteRevisionNew: {
      type: String,
      required: false,
    },
  },
  emits: ['diff-info-changed'],
  computed: {
    discardLocalChange() {
      return this.diffInfo.changeType === changeType.CHANGED || this.diffInfo.hasBreakingChange;
    },
  },
  methods: {
    diffInfoChanged(newDiffInfo, idx) {
      this.diffInfoTree[idx] = newDiffInfo;
      this.$emit('diff-info-changed', this.diffInfoTree);
    },
  },
};
</script>
