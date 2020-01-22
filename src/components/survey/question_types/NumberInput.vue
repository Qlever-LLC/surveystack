<template>
  <v-container fluid>
    <v-row>
      <v-text-field
        outlined
        :label=control.label
        type="number"
        v-model="instance[controlIndex]"
      >
      </v-text-field>
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
      type: Number,
      required: true,
    },
  },
};
</script>

<style>
</style>
