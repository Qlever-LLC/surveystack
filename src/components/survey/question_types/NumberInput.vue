<template>
  <v-container fluid>
    <v-row>
      <v-text-field outlined :label="control.label" type="number" v-model.number="control.value"></v-text-field>
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
