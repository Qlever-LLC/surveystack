<template>
  <div class="ontology question">
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
    />
    <v-autocomplete
      :value="value"
      @change="(v) => {comboboxSearch = null; onChange(v)}"
      :search-input.sync="comboboxSearch"
      :items="items"
      item-text="label"
      item-value="value"
      outlined
      :chips="!!control.options.hasMultipleSelections"
      :label="control.hint"
      :multiple="!!control.options.hasMultipleSelections"
      :menu-props="autocompleteMenuProps"
      v-if="sourceIsValid && !control.options.allowCustomSelection"
      class="full-width"
      hide-details
      single-line
    >
      <template
        v-slot:selection="data"
        v-if="!!control.options.hasMultipleSelections"
      >
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
      <template
        v-slot:item="data"
        v-if="!!control.options.hasMultipleSelections"
      >
        <v-list-item-content>
          <v-list-item-title v-html="data.item.label" />
          <!-- <v-list-item-subtitle v-html="data.item.group"></v-list-item-subtitle> -->
        </v-list-item-content>
      </template>
    </v-autocomplete>
    <v-combobox
      v-else-if="sourceIsValid && control.options.allowCustomSelection"
      :value="value"
      @change="(v) => {comboboxSearch = null; onChange(v)}"
      :search-input.sync="comboboxSearch"
      :items="items"
      item-text="label"
      item-value="value"
      outlined
      :delimiters="[',']"
      :return-object="false"
      :chips="!!control.options.hasMultipleSelections"
      :label="control.hint"
      :multiple="!!control.options.hasMultipleSelections"
      :menu-props="autocompleteMenuProps"
      ref="input"
      class="full-width custom-ontology"
      hide-details
      single-line
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
      <template
        v-slot:item="data"
        v-if="!!control.options.hasMultipleSelections"
      >
        <v-list-item-content>
          <v-list-item-title v-html="data.item.label" />
        </v-list-item-content>
      </template>
    </v-combobox>
    <v-banner
      v-else
      color="red lighten-2"
      dark
    >
      <v-icon class="mr-2">mdi-alert</v-icon>Invalid select options, please update Suvey Definition
    </v-banner>
    <app-control-more-info :value="control.moreInfo" />

  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

import { getValueOrNull } from '@/utils/surveyStack';

export default {
  mixins: [baseQuestionComponent],
  data() {
    return {
      comboboxSearch: null,
    };
  },
  methods: {
    getValueOrNull,
    onChange(v) {
      if (this.value !== v) {
        if (Array.isArray(v)) {
          this.changed(this.getValueOrNull(v.sort()));
        } else {
          this.changed(this.getValueOrNull(v));
        }
      }
    },
    info(data) {
      // console.log('info------', data);
    },
    remove(item) {
      this.changed(
        this.getValueOrNull(this.value.filter(v => v !== item.value)),
      );
    },
    removeValue(value) {
      this.changed(
        this.getValueOrNull(this.value.filter(v => v !== value)),
      );
    },
    getLabelForItemValue(value) {
      const item = this.items.find(x => x.value === value);
      return (item && item.label) || value;
    },
  },
  computed: {
    items() {
      const resource = this.resources.find(r => r.id === this.control.options.source);
      return (resource && resource.content) || [];
    },
    sourceIsValid() {
      return this.items
        && Array.isArray(this.items)
        && this.items.length > 0
        && this.items.every(({ label, value }) => label && value);
    },
    autocompleteMenuProps() {
      // default properties copied from the vuetify-autocomplete docs
      const defaultProps = {
        closeOnClick: false,
        closeOnContentClick: false,
        disableKeys: true,
        openOnClick: false,
        maxHeight: 304,
      };

      if (this.$vuetify.breakpoint.smAndDown) {
        defaultProps.maxHeight = 130;
        defaultProps.top = true;
        defaultProps.closeOnContentClick = true;
      }
      return defaultProps;
    },
  },
};
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
