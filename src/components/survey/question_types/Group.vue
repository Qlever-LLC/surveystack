<template>
  <v-container fluid>
    <app-control-label :value="control.label" />
    <app-control-hint :value="control.hint" />
    <app-control-more-info :value="control.moreInfo" />
  </v-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';


export default {
  mixins: [baseQuestionComponent],
};
</script>
