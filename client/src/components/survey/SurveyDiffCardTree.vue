<template>
  <div>
    <survey-diff-card
      class="control-item mb-2"
      v-for="diffInfo in diffInfoTree"
      :diffInfo="diffInfo"
      :key="`${diffInfo.indexPath}-${diffInfo.changeType}`"
      v-bind="{ versionNameRevisionA, versionNameRevisionB, versionNameRevisionC }"
    >
      <survey-diff-card-tree
        :diffInfoTree="diffInfo.children"
        v-bind="{ versionNameRevisionA, versionNameRevisionB, versionNameRevisionC }"
      />
    </survey-diff-card>
  </div>
</template>

<script>
import SurveyDiffCard from './SurveyDiffCard.vue';

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
    versionNameRevisionA: {
      type: String,
      required: true,
    },
    versionNameRevisionB: {
      type: String,
      required: true,
    },
    versionNameRevisionC: {
      type: String,
      required: false,
    },
  },
};
</script>
