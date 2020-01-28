<template>
  <v-container fluid>
    <v-row>
      <v-text-field
        outlined
        :label="control.label"
        v-model="control.value"
      ></v-text-field>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      value: null,
    };
  },
  props: {
    control: {
      type: Object,
      required: true,
    },
    instance: {
      type: Object,
      required: true,
    },
    change: {
      type: Function,
      required: true,
    },
  },
};
</script>

<style>
</style>
