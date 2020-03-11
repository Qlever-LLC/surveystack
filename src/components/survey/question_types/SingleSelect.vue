<template>
  <v-container fluid>
    <v-row>
      <v-radio-group
        :label="control.label"
        :value="value"
        @input="onInput"
        v-if="control.meta.source && control.meta.source.length > 0"
      >
        <v-radio
          :v-for="(item) in control.meta.source"
          :label="item.label"
          :value="item.value"
        />
      </v-radio-group>
    </v-row>
  </v-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],
  methods: {
    onInput(v) {
      if (this.value !== v) {
        this.changed(v);
      }
    },
  },
};
</script>

<style scoped>

</style>
