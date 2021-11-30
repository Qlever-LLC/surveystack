<template>
  <div>
    <survey-diff-card
      class="control-item mb-2"
      v-for="diffInfo in diffInfoTree"
      :diffInfo="diffInfo"
      :key="diffInfo.id"
      v-bind="{ oldVersionName, newVersionName }"
    >
      <survey-diff-card-tree :diffInfoTree="diffInfo.children" v-bind="{ oldVersionName, newVersionName }" />
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
    oldVersionName: {
      type: String,
      required: true,
    },
    newVersionName: {
      type: String,
      required: true,
    },
  },
};
</script>
