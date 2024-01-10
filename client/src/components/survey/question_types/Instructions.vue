<template>
  <div class="instructions">
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <div v-if="control.options.source" v-html="control.options.source" class="instructions" />
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],
};
</script>

<style scoped lang="scss">
.instructions >>> blockquote {
  border-left: 0.25em solid #dfe2e5;
  padding-left: 1em;
  color: #6a737d;
  margin: 20px 0;
}
</style>
