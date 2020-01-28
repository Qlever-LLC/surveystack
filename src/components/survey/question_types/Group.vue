<template>
  <v-container fluid>
    <v-row>
      <p class="display-1 grey--text text--darken-3">{{ control.label }} </p>
    </v-row>
  </v-container>
</template>

<script>
import controlValidator from '@/utils/controlValidator';


export default {

  props: {
    controlArgs: {
      type: Object,
      required: true,
      validator: controlValidator,
    },
  },
};
</script>

<style>
</style>
