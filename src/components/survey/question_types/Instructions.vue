<template>
  <v-container
    fluid
    class="instructions"
  >
    <v-row>
      <v-col cols="12">
        <app-control-label :value="control.label" />

        <div
          v-if="control.options.source"
          v-html="control.options.source"
          class="instructions"
        />

        <app-control-more-info :value="control.moreInfo" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],

};
</script>

<style scoped>
.instructions >>> blockquote {
  border-left: 0.25em solid #dfe2e5;
  padding-left: 1em;
  color: #6a737d;
  margin: 20px 0;
}
</style>
