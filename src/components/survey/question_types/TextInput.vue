<template>
  <v-container fluid>
    <v-row>
      <v-text-field
        outlined
        :label="controlArgs.control.label"
        v-bind:value="controlArgs.control.value"
        v-on:input="onInput"
      ></v-text-field>
    </v-row>
  </v-container>
</template>

<script>
import controlValidator from '@/utils/controlValidator';

export default {
  data() {
    return {
      value: this.controlArgs.control.value,
    };
  },
  methods: {
    onInput(event) {
      if (event !== this.value) {
        this.value = event;
        this.controlArgs.changed();
      }
    },
  },
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
