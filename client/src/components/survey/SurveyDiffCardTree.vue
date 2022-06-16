<template>
  <div>
    <survey-diff-card
      class="control-item mb-2"
      v-for="diffInfo in diffInfoTree"
      :diffInfo="diffInfo"
      :key="`${diffInfo.indexPath}-${diffInfo.changeType}`"
      v-bind="{
        versionNameLocalRevision,
        versionNameRemoteRevisionOld,
        versionNameRemoteRevisionNew,
      }"
    >
      <survey-diff-card-tree
        :diffInfoTree="diffInfo.children"
        v-bind="{
          versionNameLocalRevision,
          versionNameRemoteRevisionOld,
          versionNameRemoteRevisionNew,
        }"
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
};
</script>
