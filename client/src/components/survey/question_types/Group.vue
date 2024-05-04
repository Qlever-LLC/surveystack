<template>
  <a-container fluid>
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <app-control-hint :value="control.hint" />
    <app-control-more-info :value="control.moreInfo" />
  </a-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],
};
</script>
