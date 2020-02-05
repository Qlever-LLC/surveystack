<template>
  <v-container fluid>
    <v-row>
      <p class="display-1 grey--text text--darken-3">{{ control.label }} </p>
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
