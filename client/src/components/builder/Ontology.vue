<template>
  <v-select
    v-if="!control.options.allowCustomSelection && !control.options.allowAutocomplete"
    label="Default value"
    :value="getValue"
    @change="
      (v) => {
        onChange(v);
      }
    "
    :items="items"
    item-text="label"
    item-value="value"
    :menu-props="autocompleteMenuProps"
    :chips="!!control.options.hasMultipleSelections"
    :multiple="!!control.options.hasMultipleSelections"
    :disabled="!sourceIsValid"
    color="focus"
    outlined
    clearable
    class="full-width dropdown"
    data-test-id="dropdown"
  >
    <template v-slot:selection="{ item, index }" v-if="!!control.options.hasMultipleSelections">
      <v-chip v-if="index === 0">
        <span>{{ item.label }}</span>
      </v-chip>
      <span v-if="index === 1" class="grey--text text-caption"> (+{{ value.length - 1 }} others) </span>
    </template>
    <template v-slot:item="data" v-if="!!control.options.hasMultipleSelections">
      <v-list-item-content>
        <v-list-item-title>
          {{ data.item.label }}
          <v-chip v-if="data.item.count" small class="ma-2">
            {{ data.item.count }}
          </v-chip>
        </v-list-item-title>
      </v-list-item-content>
    </template>
  </v-select>
  <v-autocomplete
    v-else-if="!control.options.allowCustomSelection && control.options.allowAutocomplete"
    label="Default value"
    :value="getValue"
    @change="
      (v) => {
        comboboxSearch = null;
        onChange(v);
      }
    "
    :search-input.sync="comboboxSearch"
    :items="items"
    item-text="label"
    item-value="value"
    :menu-props="autocompleteMenuProps"
    :chips="!!control.options.hasMultipleSelections"
    :multiple="!!control.options.hasMultipleSelections"
    :disabled="!sourceIsValid"
    color="focus"
    outlined
    clearable
    class="full-width dropdown"
    data-test-id="autocomplete"
  >
    <template v-slot:selection="{ item, index }" v-if="!!control.options.hasMultipleSelections">
      <v-chip v-if="index === 0">
        <span>{{ item.label }}</span>
      </v-chip>
      <span v-if="index === 1" class="grey--text text-caption"> (+{{ value.length - 1 }} others) </span>
    </template>
    <template v-slot:item="data" v-if="!!control.options.hasMultipleSelections">
      <v-list-item-content>
        <v-list-item-title>
          {{ data.item.label }}
          <v-chip v-if="data.item.count" small class="ma-2">
            {{ data.item.count }}
          </v-chip>
        </v-list-item-title>
      </v-list-item-content>
    </template>
  </v-autocomplete>
  <v-combobox
    v-else-if="control.options.allowCustomSelection"
    ref="input"
    label="Default value"
    :value="getValue"
    @change="
      (v) => {
        comboboxSearch = null;
        onChange(v);
      }
    "
    :search-input.sync="comboboxSearch"
    :items="items"
    item-text="label"
    item-value="value"
    :delimiters="[',']"
    :return-object="false"
    :menu-props="autocompleteMenuProps"
    :chips="!!control.options.hasMultipleSelections"
    :multiple="!!control.options.hasMultipleSelections"
    :disabled="!sourceIsValid"
    color="focus"
    outlined
    clearable
    class="full-width custom-ontology dropdown"
    data-test-id="combobox"
  >
    <template v-slot:selection="{ item, index }" v-if="!!control.options.hasMultipleSelections">
      <v-chip v-if="index === 0">
        <span>{{ getLabelForItemValue(item) }}</span>
      </v-chip>
      <span v-if="index === 1" class="grey--text text-caption"> (+{{ value.length - 1 }} others) </span>
    </template>
    <template v-slot:no-data>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>
            No values matching "<strong>{{ comboboxSearch }}</strong
            >". Press <kbd>enter</kbd> <span v-if="!!control.options.hasMultipleSelections">or <kbd>,</kbd></span> to
            create a new one
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </template>
  </v-combobox>
</template>

<script>
import { isNil, sortBy, uniq, without } from 'lodash';
import { getValueOrNull } from '@/utils/surveyStack';
import { resourceTypes } from '@/utils/resources';
import { fetchSubmissionUniqueItems } from '@/utils/submissions';

export default {
  props: {
    value: { required: true },
    control: { type: Object, required: true },
    resources: { default: () => [] },
  },
  data() {
    return {
      isLoading: false,
      comboboxSearch: null,
      submissionItems: [],
    };
  },
  methods: {
    getValueOrNull,
    onChange(value) {
      this.$emit('input', getValueOrNull(value));
    },
    remove(value) {
      this.$emit('input', getValueOrNull(this.value.filter((v) => v !== value)));
    },
    getLabelForItemValue(value) {
      const item = this.items.find((x) => x.value === value);
      return (item && item.label) || value;
    },
  },
  computed: {
    getAryValue() {
      return Array.isArray(this.value) ? this.value : this.value ? [this.value] : [];
    },
    getValue() {
      return this.control.options.hasMultipleSelections ? this.getAryValue : this.getAryValue[0] || this.value;
    },
    resource() {
      return this.resources.find((r) => r.id === this.control.options.source);
    },
    hasReference() {
      return !!this.resource && this.resource.type === resourceTypes.SURVEY_REFERENCE;
    },
    items() {
      const defaultItems = this.hasReference ? this.submissionItems : this.resource ? this.resource.content : [];
      // All the custom items the users typed in
      const customItems = without(
        uniq(this.getAryValue).filter((v) => !isNil(v)), // get all the uniq non-empty values
        ...defaultItems.map((i) => i.value) // without the default values
      ).map((value) => ({ label: value, value }));
      const allItems = sortBy(
        [...defaultItems, ...customItems],
        [
          (a) => !customItems.includes(a.value), // move selected items first
          'label',
        ]
      );
      return allItems;
    },
    sourceIsValid() {
      return this.items && Array.isArray(this.items) && this.items.every(({ label, value }) => label && value);
    },
    autocompleteMenuProps() {
      // default properties copied from the vuetify-autocomplete docs
      const defaultProps = {
        closeOnClick: false,
        closeOnContentClick: false,
        disableKeys: true,
        openOnClick: false,
        maxHeight: 304,
        color: 'focus',
        bottom: true,
        offsetY: true,
      };

      if (this.$vuetify.breakpoint.smAndDown || this.forceMobile) {
        defaultProps.maxHeight = 130;
        defaultProps.top = true;
        defaultProps.closeOnContentClick = true;
      }
      return defaultProps;
    },
  },
  async mounted() {
    if (this.hasReference) {
      const { id, path } = this.resource.content;
      this.isLoading = true;
      try {
        this.submissionItems = await fetchSubmissionUniqueItems(id, path);
      } finally {
        this.isLoading = false;
      }
    }
  },
};
</script>

<style scoped>
.full-width {
  width: 100%;
}

>>> .v-list-item.v-list-item--active {
  color: var(--v-focus-base) !important;
}

.dropdown >>> .v-select__selections {
  min-height: 56px !important;
}
</style>
