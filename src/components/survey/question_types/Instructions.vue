<template>
  <v-container fluid class="instructions">
    <v-row>
      <v-col cols="12">
        <p v-if="control.title" class="mb-4">{{ control.title }}</p>
        <div
          v-if="control.options.source"
          v-html="control.options.source"
          class="instructions"
        />
        <p v-if="control.hint" class="mt-4">{{ control.hint }}</p>
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
  border-left: .25em solid #dfe2e5;
  padding-left: 1em;
  color: #6a737d;
  margin: 20px 0;
}


</style>
