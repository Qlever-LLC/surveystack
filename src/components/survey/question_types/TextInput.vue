<template>
  <v-container fluid>
    <v-row>
      <v-text-field
        outlined
        :label="control.label"
        v-bind:value="control.value"
        v-on:input="onInput"
      ></v-text-field>
    </v-row>
  </v-container>
</template>

<script>
import controlComputed from '@/utils/controls/computed';
import controlProps from '@/utils/controls/props';

export default {
  data() {
    return {
      value: this.controlArgs.control.value,
    };
  },
  methods: {
    onInput(v) {
      if (this.control.value !== v) {
        this.changed(v);
      }
    },
  },
  props: {
    ...controlProps,
  },
  computed: {
    ...controlComputed,
  },
};
</script>

<style>
</style>
