<template>
  <v-container fluid>
    <v-row>
      <v-radio-group
        :label="control.label"
        :value="value"
        @change="onChange"
        v-if="sourceIsValid"
      >
        <v-radio
          v-for="(item) in control.options.source"
          :label="item.label"
          :value="item.value"
          :key="item.key"
        />
      </v-radio-group>
      <div v-else>
        Invalid Select Options, please update Suvey Definition
      </div>
    </v-row>
  </v-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],
  methods: {
    onChange(v) {
      if (this.value !== v) {
        this.changed(v);
      }
    },
  },
  computed: {
    sourceIsValid() {
      return this.control.options.source
        && Array.isArray(this.control.options.source)
        && this.control.options.source.length > 0
        && this.control.options.source.every(({ label, value }) => label && value);
    },
  },
};
</script>

<style scoped>

</style>
