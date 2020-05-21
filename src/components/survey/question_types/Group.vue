<template>
  <v-container fluid>
    <p v-if="control.title" class="mb-2">{{ control.title }}</p>
    <p class="display-1 grey--text text--darken-3">{{ control.label }} </p>
    <p v-if="control.hint" class="mt-2">{{ control.hint }}</p>
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
