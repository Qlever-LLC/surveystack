<template>
  <v-container fluid>
    <v-row>
      <p class="display-1 grey--text text--darken-3">{{ control.label }} </p>
    </v-row>
  </v-container>
</template>

<script>
import controlProps from '@/utils/controls/props';

export default {
  props: controlProps,
};
</script>

<style>
</style>
