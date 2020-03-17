<template>
  <v-container fluid>
    <v-row>
        <!-- v-model="values" -->
      <v-autocomplete
        :value="value"
        @change="onChange"
        :items="control.options.source || []"
        item-text="label"
        item-value="value"
        outlined
        chips
        :label="control.label"
        :multiple="!!control.options.hasMultipleSelections"
        v-if="sourceIsValid"
      >
        <template v-slot:selection="data" v-if="!!control.options.hasMultipleSelections">
          <v-chip
            v-bind="data.attrs"
            :input-value="data.selected"
            close
            @click="data.select"
            @click:close="remove(data.item)"
          >
            {{ data.item.label }}
          </v-chip>
        </template>
        <template v-slot:item="data" v-if="!!control.options.hasMultipleSelections">
          <v-list-item-content>
            <v-list-item-title v-html="data.item.label" />
            <!-- <v-list-item-subtitle v-html="data.item.group"></v-list-item-subtitle> -->
          </v-list-item-content>
        </template>
      </v-autocomplete>
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
    remove(item) {
      this.changed(
        this.value.filter(v => v !== item.value),
      );
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
