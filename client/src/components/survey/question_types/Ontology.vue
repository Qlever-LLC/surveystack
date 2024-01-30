<!-- TODO in unit test before v-select and v-autocomplete were different
  data-test-id="dropdown" exists
  data-test-id="autocomplete" was removed-->
<template>
  <div class="ontology question">
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      :is-modified="meta && !!meta.dateModified"
      @initialize="initialize" />
    <a-select
      v-if="sourceIsValid && !control.options.allowCustomSelection"
      :label="control.hint"
      :placeholder="getPlaceholder"
      :modelValue="getValue"
      @update:modelValue="onChange"
      @focus="onFocus"
      @blur="onBlur"
      :items="items"
      item-title="label"
      item-value="value"
      :menu-props="autocompleteMenuProps"
      :multiple="!!control.options.hasMultipleSelections"
      color="focus"
      hide-details
      variant="outlined"
      class="full-width dropdown"
      data-test-id="dropdown"
      clearable
      cssMinHeight56px
      :chipSlot="!!control.options.hasMultipleSelections"
      :itemSlot="!!control.options.hasMultipleSelections">
      <template v-slot:chip="{ props, item }" v-if="!!control.options.hasMultipleSelections">
        <a-chip v-bind="props" closable>
          {{ item.title }}
        </a-chip>
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
      allowCustomItem
      v-else-if="sourceIsValid && control.options.allowCustomSelection"
      :label="control.hint"
      :placeholder="getPlaceholder"
      :modelValue="getValue"
      @update:modelValue="onChange"
      v-model:search="comboboxSearch"
      @focus="onFocus"
      @blur="onBlur"
      :items="items"
      item-title="label"
      item-value="value"
      :menu-props="autocompleteMenuProps"
      :delimiters="[',']"
      :return-object="false"
      :multiple="!!control.options.hasMultipleSelections"
      color="focus"
      variant="outlined"
      hide-details
      class="full-width custom-ontology dropdown"
      data-test-id="combobox"
      cssMinHeight56px
      :chipSlot="!!control.options.hasMultipleSelections"
      selectionSlot>
      <template v-slot:chip="{ props, item }" v-if="!!control.options.hasMultipleSelections">
        <a-chip v-bind="props" closable>
          {{ getLabelForItemValue(item.value) }}
        </a-chip>
      </template>
      <template v-slot:selection="{ item }" v-if="!control.options.hasMultipleSelections">
        {{ getLabelForItemValue(item.value) }}
      </template>
    </a-select>
    <a-banner v-else-if="isLoading"> <a-icon class="mr-2 mdi-spin">mdi-loading</a-icon>Loading</a-banner>
    <a-banner v-else bgColor="red-lighten-2">
      <a-icon class="mr-2">mdi-alert</a-icon>Invalid select options, please update Survey Definition
    </a-banner>
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import { isNil, uniq, without } from 'lodash';
import baseQuestionComponent from './BaseQuestionComponent';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
import { getValueOrNull } from '@/utils/surveyStack';
import { resourceTypes } from '@/utils/resources';
import { fetchSubmissionUniqueItems } from '@/utils/submissions';

export default {
  mixins: [baseQuestionComponent],
  components: {
    appControlLabel,
    appControlMoreInfo,
  },
  data() {
    return {
      isLoading: false,
      comboboxSearch: null,
      submissionItems: [],
      isFocus: false,
    };
  },
  methods: {
    clickOnChip(data) {
      data.select;
    },
    onChange(value) {
      this.comboboxSearch = null;
      if (this.modelValue !== value) {
        if (Array.isArray(value)) {
          this.changed(getValueOrNull(value.map(getValueOrNull)));
        } else {
          const nextValue = getValueOrNull(value);
          this.changed(nextValue ? [nextValue] : nextValue);
        }
      }
    },
    remove(item) {
      this.changed(getValueOrNull(this.modelValue.filter((v) => v !== item.value)));
    },
    removeValue(value) {
      this.changed(getValueOrNull(this.modelValue.filter((v) => v !== value)));
    },
    getLabelForItemValue(value) {
      const item = this.items.find((x) => x.value === value);
      return (item && item.label) || value;
    },
    onFocus() {
      this.isFocus = true;
    },
    onBlur() {
      this.isFocus = false;
    },
  },
  computed: {
    getArrayValue() {
      return Array.isArray(this.modelValue) ? this.modelValue : this.modelValue ? [this.modelValue] : [];
    },
    getValue() {
      return this.control.options.hasMultipleSelections ? this.getArrayValue : this.getArrayValue[0] || this.modelValue;
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
        uniq(this.getArrayValue).filter((v) => !isNil(v)), // get all the uniq non-empty values
        ...defaultItems.map((i) => i.value) // without the default values
      ).map((value) => ({ label: value, value }));

      return [...defaultItems, ...customItems];
    },
    sourceIsValid() {
      return this.items && Array.isArray(this.items) && this.items.every(({ label, value }) => label && value);
    },
    autocompleteMenuProps() {
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
    getPlaceholder() {
      if ((this.control.hint && this.isFocus) || !this.control.hint) {
        if (!this.control.options.allowCustomSelection) {
          return 'Type to search';
        } else if (this.control.options.allowCustomSelection) {
          return 'Type to search or add custom answer';
        }
      }
      return undefined;
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
