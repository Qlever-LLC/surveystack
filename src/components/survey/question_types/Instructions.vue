<template>
  <v-container fluid>
    <v-row>
      <div
        v-if="control.options.source"
        v-html="control.options.source"
      />
    </v-row>
  </v-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],

};
</script>

<style>

</style>
