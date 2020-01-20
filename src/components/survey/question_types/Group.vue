<template>
  <v-container fluid>
    <v-row>
      <p class="display-1 grey--text text--darken-3">{{ control.label }} </p>
    </v-row>
  </v-container>
</template>

<script>
export default {
  props: {
    control: {
      type: Object,
      required: true,
    },
    instance: {
      type: Object,
      required: true,
    },
    position: {
      type: Array,
      required: true,
    },
    controlIndex: {
      type: String,
      required: true,
    },
  },
};
</script>

<style>
</style>
