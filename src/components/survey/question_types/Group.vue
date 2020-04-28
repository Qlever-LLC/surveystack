<template>
  <v-container fluid>
    <p class="display-1 grey--text text--darken-3">{{ control.label }} </p>
    <p class="mt-2">{{ control.hint }}</p>
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
