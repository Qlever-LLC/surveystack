<template>
  <v-container fluid>
    <v-row>
      <v-autocomplete
        :value="value"
        @change="onChange"
        :items="control.options.source || []"
        item-text="label"
        item-value="value"
        outlined
        :chips="!!control.options.hasMultipleSelections"
        :label="control.label"
        :multiple="!!control.options.hasMultipleSelections"
        v-if="sourceIsValid && !control.options.allowCustomSelection"
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
      <v-combobox
        :value="value"
        @change="onChange"
        :items="control.options.source || []"
        item-text="label"
        item-value="value"
        outlined
        :delimiters="[',']"
        :return-object="false"
        :chips="!!control.options.hasMultipleSelections"
        :label="control.label"
        :multiple="!!control.options.hasMultipleSelections"
        v-else-if="sourceIsValid && control.options.allowCustomSelection"
      >
        <template v-slot:selection="data">
          <v-chip
            v-bind="data.attrs"
            :input-value="data.selected"
            close
            @click="data.select"
            @click:close="removeValue(data.item); info(data)"
            v-if="!!control.options.hasMultipleSelections"
          >
            {{ getLabelForItemValue(data.item) }}
          </v-chip>
          <div v-else>
            {{ getLabelForItemValue(data.item) }}
          </div>
        </template>
        <template v-slot:item="data" v-if="!!control.options.hasMultipleSelections">
          <v-list-item-content>
            <v-list-item-title v-html="data.item.label" />
            <!-- <v-list-item-subtitle v-html="data.item.group"></v-list-item-subtitle> -->
          </v-list-item-content>
        </template>
      </v-combobox>
      <div v-else>
        Invalid Select Options, please update Suvey Definition
      </div>
    </v-row>
    <p class="mt-2">{{ control.hint }}</p>
  </v-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],
  methods: {
    onChange(v) {
      if (this.value !== v) {
        if (Array.isArray(v)) {
          this.changed(v.sort());
        } else {
          this.changed(v);
        }
      }
    },
    info(data) {
      console.log('info------', data);
    },
    remove(item) {
      this.changed(
        this.value.filter(v => v !== item.value),
      );
    },
    removeValue(value) {
      this.changed(
        this.value.filter(v => v !== value),
      );
    },
    getLabelForItemValue(value) {
      const item = this.control.options.source.find(x => x.value === value);
      return (item && item.label) || value;
    },
    getLabelForItemValue2(value) {
      console.log(value);
      const item = this.control.options.source.find(x => x.value === value);
      return (item && item.label) || value;
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
