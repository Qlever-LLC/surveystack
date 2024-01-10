<!-- TODO in unit test before v-select and v-autocomplete were different
data-test-id="dropdown" exists
data-test-id="autocomplete" was removed-->
<template>
  <a-select
    v-if="!customAnswer"
    :modelValue="getValue"
    @update:modelValue="updateAutocomplete"
    class="full-width dropdown"
    clearable
    color="focus"
    cssMinHeightAuto
    data-test-id="dropdown"
    :dense="dense"
    :disabled="!sourceIsValid"
    hide-details
    :items="items"
    item-title="label"
    item-value="value"
    label="Default value"
    :menu-props="autocompleteMenuProps"
    :multiple="multiple"
    :variant="outlined ? 'outlined' : undefined"
    :itemSlot="multiple">
    <template v-slot:chip="{ props, item }">
      <a-chip v-bind="props" closable>{{ item.raw.value }}</a-chip>
    </template>
    <template v-slot:item="{ props, item }">
      <a-list-item v-bind="props">
        <a-list-item-title>
          {{ item.label }}
          <a-chip v-if="item.count" small class="ma-2">
            {{ item.count }}
          </a-chip>
        </a-list-item-title>
      </a-list-item>
    </template>
  </a-select>
  <a-select
    v-else-if="customAnswer"
    allowCustomItem
    :modelValue="getValue"
    @update:modelValue="updateCombobox"
    v-model:search="comboboxSearch"
    class="full-width custom-ontology dropdown"
    clearable
    color="focus"
    cssMinHeightAuto
    data-test-id="combobox"
    :delimiters="[',']"
    :dense="dense"
    :disabled="!sourceIsValid"
    hide-details
    :items="items"
    item-title="label"
    item-value="value"
    label="Default value"
    :menu-props="autocompleteMenuProps"
    :multiple="multiple"
    :outlined="outlined"
    selectionSlot>
    <template v-slot:chip="{ props, item }">
      <a-chip v-bind="props" closable>
        {{ getLabelForItemValue(item.value) }}
      </a-chip>
    </template>
    <template v-slot:selection="{ item }" v-if="!multiple">
      {{ getLabelForItemValue(item.value) }}
    </template>
  </a-select>
</template>

<script>
import { isNil, uniq, without } from 'lodash';
import { getValueOrNull } from '@/utils/surveyStack';
import { resourceTypes } from '@/utils/resources';
import { fetchSubmissionUniqueItems } from '@/utils/submissions';

export default {
  props: {
    value: { required: true },
    multiple: { type: Boolean, default: false },
    customAnswer: { type: Boolean, default: false },
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
      values: this.value,
    };
  },
  methods: {
    emitValueToParent(value) {
      this.values = getValueOrNull(Array.isArray(value) ? value.map(getValueOrNull) : value);
      this.$emit('input', this.values);
    },
    updateAutocomplete(value) {
      this.emitValueToParent(value);
    },
    updateCombobox(value) {
      this.emitValueToParent(value);
      this.comboboxSearch = null;
    },
    getLabelForItemValue(value) {
      const item = this.items.find((x) => x.value === value);
      return (item && item.label) || value;
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

      if (this.$vuetify.display.smAndDown || this.forceMobile) {
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

<style scoped lang="scss">
.full-width {
  width: 100%;
}

.dropdown >>> .v-list-item.v-list-item--active {
  color: rgb(var(--v-theme-focus)) !important;
}
</style>
