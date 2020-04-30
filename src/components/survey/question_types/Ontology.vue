<template>
  <v-container fluid>
    <v-row>
      <v-autocomplete
        :value="value"
        @change="onChange"
        :items="items"
        item-text="label"
        item-value="value"
        outlined
        :chips="!!control.options.hasMultipleSelections"
        :label="control.label"
        :multiple="!!control.options.hasMultipleSelections"
        :menu-props="autocompleteMenuProps"
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
        :items="items"
        item-text="label"
        item-value="value"
        outlined
        :delimiters="[',']"
        :return-object="false"
        :chips="!!control.options.hasMultipleSelections"
        :label="control.label"
        :multiple="!!control.options.hasMultipleSelections"
        :menu-props="autocompleteMenuProps"
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
      const item = this.items.find(x => x.value === value);
      return (item && item.label) || value;
    },
  },
  computed: {
    items() {
      const { content } = this.resources.find(resource => resource.id === this.control.options.source);
      return content || [];
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

</style>
