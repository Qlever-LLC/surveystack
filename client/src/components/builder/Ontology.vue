<template>
  <v-select
    v-if="!customAnswer && !autocomplete"
    label="Default value"
    :value="getValue"
    @change="onChange"
    :items="items"
    item-text="label"
    item-value="value"
    :menu-props="autocompleteMenuProps"
    :chips="multiple"
    :multiple="multiple"
    :disabled="!sourceIsValid"
    :dense="dense"
    color="focus"
    :outlined="outlined"
    clearable
    class="full-width dropdown"
    data-test-id="dropdown"
  >
    <template v-slot:selection="{ item, index }" v-if="multiple">
      <v-chip v-if="index === 0 && !dense" small>
        <span>{{ item.label }}</span>
      </v-chip>
      <span v-else-if="index === 0 && dense">{{ item.label }}</span>
      <span v-if="index === 1" class="ml-2 grey--text text-caption"> (+{{ value.length - 1 }} others) </span>
    </template>
    <template v-slot:item="data" v-if="multiple">
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
    v-else-if="!customAnswer && autocomplete"
    ref="dropdownRef"
    label="Default value"
    :value="getValue"
    @change="onChange"
    :search-input.sync="comboboxSearch"
    :items="items"
    item-text="label"
    item-value="value"
    :menu-props="autocompleteMenuProps"
    :chips="multiple"
    :multiple="multiple"
    :disabled="!sourceIsValid"
    :dense="dense"
    color="focus"
    :outlined="outlined"
    clearable
    class="full-width dropdown"
    data-test-id="autocomplete"
  >
    <template v-slot:selection="{ item, index }" v-if="multiple">
      <v-chip v-if="index === 0 && !dense" small>
        <span>{{ item.label }}</span>
      </v-chip>
      <span v-else-if="index === 0 && dense">{{ item.label }}</span>
      <span v-if="index === 1" class="ml-2 grey--text text-caption"> (+{{ value.length - 1 }} others) </span>
    </template>
    <template v-slot:item="data" v-if="multiple">
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
    v-else-if="customAnswer"
    ref="dropdownRef"
    label="Default value"
    :value="getValue"
    @change="onChange"
    :search-input.sync="comboboxSearch"
    :items="items"
    item-text="label"
    item-value="value"
    :delimiters="[',']"
    :return-object="false"
    :menu-props="autocompleteMenuProps"
    :chips="multiple"
    :multiple="multiple"
    :disabled="!sourceIsValid"
    :dense="dense"
    color="focus"
    :outlined="outlined"
    clearable
    class="full-width custom-ontology dropdown"
    data-test-id="combobox"
  >
    <template v-slot:selection="{ item, index }" v-if="multiple">
      <v-chip v-if="index === 0 && !dense" small>
        <span>{{ getLabelForItemValue(item) }}</span>
      </v-chip>
      <span v-else-if="index === 0 && dense">{{ getLabelForItemValue(item) }}</span>
      <span v-if="index === 1" class="ml-2 grey--text text-caption"> (+{{ value.length - 1 }} others) </span>
    </template>
    <template v-slot:no-data>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>
            No values matching "<strong>{{ comboboxSearch }}</strong
            >". Press <kbd>enter</kbd> <span v-if="multiple">or <kbd>,</kbd></span> to create a new one
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
    multiple: { type: Boolean, default: false },
    customAnswer: { type: Boolean, default: false },
    autocomplete: { type: Boolean, default: false },
    dense: { type: Boolean, default: false },
    outlined: { type: Boolean, default: false },
    source: { type: String },
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
    onChange(value) {
      this.comboboxSearch = null;
      this.$emit('input', getValueOrNull(value));
      this.$refs.dropdownRef.isMenuActive = false;
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
      return this.multiple ? this.getAryValue : this.getAryValue[0] || this.value;
    },
    resource() {
      return this.resources.find((r) => r.id === this.source);
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
        disableKeys: true,
        openOnClick: false,
        color: 'focus',
      };

      if (this.$vuetify.breakpoint.smAndDown || this.forceMobile) {
        defaultProps.maxHeight = 130;
        defaultProps.top = true;
        defaultProps.closeOnContentClick = true;
      } else {
        defaultProps.maxHeight = 304;
        defaultProps.bottom = true;
        defaultProps.offsetY = true;
        defaultProps.closeOnContentClick = false;
      }
      return defaultProps;
    },
  },
  watch: {
    comboboxSearch(newVal) {
      const match = newVal
        ? this.items.find((item) => item.label.toLowerCase().indexOf(newVal.toLowerCase()) >= 0)
        : undefined;
      if (!match) {
        this.$refs.dropdownRef.setMenuIndex(-1);
      }
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

.dropdown >>> .v-list-item.v-list-item--active {
  color: var(--v-focus-base) !important;
}

.dropdown >>> .v-select__selections {
  min-height: 56px !important;
}

.dropdown.v-input--dense >>> .v-select__selections {
  min-height: auto !important;
}
</style>
