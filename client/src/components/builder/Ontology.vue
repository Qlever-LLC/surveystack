<template>
  <a-select
    v-if="!customAnswer && !autocomplete"
    label="Default value"
    :value="getValue"
    @change="onChange"
    :items="items"
    item-text="label"
    item-value="value"
    :menu-props="autocompleteMenuProps"
    :multiple="multiple"
    :disabled="!sourceIsValid"
    :dense="dense"
    color="focus"
    :outlined="outlined"
    clearable
    hide-details
    class="full-width dropdown"
    data-test-id="dropdown"
    :itemSlot="multiple"
    cssMinHeightAuto
  >
    <template v-slot:item="data">
      <v-list-item-content>
        <v-list-item-title>
          {{ data.item.label }}
          <v-chip v-if="data.item.count" small class="ma-2">
            {{ data.item.count }}
          </v-chip>
        </v-list-item-title>
      </v-list-item-content>
    </template>
  </a-select>
  <a-select
    engineering="autocomplete"
    v-else-if="!customAnswer && autocomplete"
    @change="onChange"
    ref="dropdownRef"
    label="Default value"
    :value="getValue"
    :items="items"
    item-text="label"
    item-value="value"
    :menu-props="autocompleteMenuProps"
    :multiple="multiple"
    :disabled="!sourceIsValid"
    :dense="dense"
    color="focus"
    :outlined="outlined"
    clearable
    hide-details
    class="full-width dropdown"
    data-test-id="autocomplete"
    :itemSlot="multiple"
    cssMinHeightAuto
  >
    <template v-slot:item="data">
      <v-list-item-content>
        <v-list-item-title>
          {{ data.item.label }}
          <v-chip v-if="data.item.count" small class="ma-2">
            {{ data.item.count }}
          </v-chip>
        </v-list-item-title>
      </v-list-item-content>
    </template>
  </a-select>
  <a-select
    engineering="combobox"
    v-else-if="customAnswer"
    ref="dropdownRef"
    label="Default value"
    :value="getValue"
    @input="setValue"
    @change="onChange"
    :search-input.sync="comboboxSearch"
    :items="items"
    item-text="label"
    item-value="value"
    :delimiters="[',']"
    :return-object="false"
    :menu-props="autocompleteMenuProps"
    :multiple="multiple"
    :disabled="!sourceIsValid"
    :dense="dense"
    color="focus"
    :outlined="outlined"
    clearable
    hide-details
    class="full-width custom-ontology dropdown"
    data-test-id="combobox"
    selectionSlot
    noDataSlot
    cssMinHeightAuto
  >
    <template v-slot:selection="data" v-if="multiple">
      <v-chip :input-value="data.selected" close @click="clickOnChip(data)" @click:close="remove(data.item)">
        {{ getLabelForItemValue(data.item) }}
      </v-chip>
    </template>
    <template v-slot:selection="data" v-else>
      {{ getLabelForItemValue(data.item) }}
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
  </a-select>
</template>

<script>
import { isNil, uniq, without } from 'lodash';
import { getValueOrNull } from '@/utils/surveyStack';
import { resourceTypes } from '@/utils/resources';
import { fetchSubmissionUniqueItems } from '@/utils/submissions';
import ASelect from '@/components/ui/ASelect.vue';

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
  components: {
    ASelect,
  },
  data() {
    return {
      isLoading: false,
      comboboxSearch: null,
      submissionItems: [],
      values: this.value,
    };
  },
  methods: {
    clickOnChip(data) {
      data.select;
    },
    onChange(value) {
      this.comboboxSearch = null;
      this.$emit('input', getValueOrNull(Array.isArray(value) ? value.map(getValueOrNull) : value));
      if (this.$refs.dropdownRef && !this.multiple) {
        this.$refs.dropdownRef.blur();
      }
    },
    remove(value) {
      this.setValue(getValueOrNull(this.values.filter((v) => v !== value)));
    },
    getLabelForItemValue(value) {
      const item = this.items.find((x) => x.value === value);
      return (item && item.label) || value;
    },
    setValue(value) {
      this.values = getValueOrNull(Array.isArray(value) ? value.map(getValueOrNull) : value);
      if (this.multiple) {
        this.$emit('input', this.values);
      }
    },
  },
  computed: {
    getArrayValue() {
      return Array.isArray(this.values) ? this.values : this.values ? [this.values] : [];
    },
    getValue() {
      return this.multiple ? this.getArrayValue : this.getArrayValue[0] || this.values;
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
        uniq(this.getArrayValue).filter((v) => !isNil(v)), // get all the uniq non-empty values
        ...defaultItems.map((i) => i.value) // without the default values
      ).map((value) => ({ label: value, value }));

      return [...defaultItems, ...customItems];
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
</style>
