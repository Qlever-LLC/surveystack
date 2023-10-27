<template>
  <div class="ontology question">
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <a-select
      v-if="sourceIsValid && !control.options.allowCustomSelection && !control.options.allowAutocomplete"
      :label="control.hint"
      :placeholder="getPlaceholder"
      :value="getValue"
      @change="onChange"
      @focus="onFocus"
      @blur="onBlur"
      :items="items"
      item-text="label"
      item-value="value"
      :menu-props="autocompleteMenuProps"
      :chips="!!control.options.hasMultipleSelections"
      :multiple="!!control.options.hasMultipleSelections"
      color="focus"
      hide-details
      outlined
      class="full-width dropdown"
      data-test-id="dropdown"
      :selectionSlot="!!control.options.hasMultipleSelections"
      :itemSlot="!!control.options.hasMultipleSelections"
    >
      <template v-slot:selection="data">
        <v-chip
          v-bind="data.attrs"
          :input-value="data.selected"
          close
          @click="clickOnChip(data)"
          @click:close="remove(data.item)"
        >
          {{ data.item.label }}
        </v-chip>
      </template>
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
      v-else-if="sourceIsValid && !control.options.allowCustomSelection && control.options.allowAutocomplete"
      @blur="onBlur"
      @change="onChange"
      @focus="onFocus"
      ref="dropdownRef"
      :label="control.hint"
      :placeholder="getPlaceholder"
      :value="getValue"
      :items="items"
      item-text="label"
      item-value="value"
      :delimiters="[',']"
      :menu-props="autocompleteMenuProps"
      :chips="!!control.options.hasMultipleSelections"
      :multiple="!!control.options.hasMultipleSelections"
      color="focus"
      outlined
      hide-details
      class="full-width dropdown"
      data-test-id="autocomplete"
      :selectionSlot="!!control.options.hasMultipleSelections"
      :itemSlot="!!control.options.hasMultipleSelections"
    >
      <template v-slot:selection="data">
        <v-chip
          v-bind="data.attrs"
          :input-value="data.selected"
          close
          @click="clickOnChip(data)"
          @click:close="remove(data.item)"
        >
          {{ data.item.label }}
        </v-chip>
      </template>
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
      v-else-if="sourceIsValid && control.options.allowCustomSelection"
      ref="dropdownRef"
      :label="control.hint"
      :placeholder="getPlaceholder"
      :value="getValue"
      @change="onChange"
      @focus="onFocus"
      @blur="onBlur"
      :items="items"
      item-text="label"
      item-value="value"
      :menu-props="autocompleteMenuProps"
      :delimiters="[',']"
      :return-object="false"
      :search-input.sync="comboboxSearch"
      :chips="!!control.options.hasMultipleSelections"
      :multiple="!!control.options.hasMultipleSelections"
      color="focus"
      outlined
      hide-details
      class="full-width custom-ontology dropdown"
      data-test-id="combobox"
      selectionSlot
      noDataSlot
    >
      <template v-slot:selection="data" v-if="!!control.options.hasMultipleSelections">
        <v-chip
          v-bind="data.attrs"
          :input-value="data.selected"
          close
          @click="clickOnChip(data)"
          @click:close="removeValue(data.item)"
        >
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
              >". Press <kbd>enter</kbd> <span v-if="!!control.options.hasMultipleSelections">or <kbd>,</kbd></span> to
              create a new one
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
    </a-select>
    <v-banner v-else-if="isLoading"> <v-icon class="mr-2 mdi-spin">mdi-loading</v-icon>Loading </v-banner>
    <v-banner v-else color="red lighten-2" dark>
      <v-icon class="mr-2">mdi-alert</v-icon>Invalid select options, please update Survey Definition
    </v-banner>
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import { isNil, sortBy, uniq, without } from 'lodash';
import baseQuestionComponent from './BaseQuestionComponent';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
import { getValueOrNull } from '@/utils/surveyStack';
import { resourceTypes } from '@/utils/resources';
import { fetchSubmissionUniqueItems } from '@/utils/submissions';
import ASelect from '@/components/ui/ASelect.vue';

export default {
  mixins: [baseQuestionComponent],
  components: {
    appControlLabel,
    appControlMoreInfo,
    ASelect,
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
      if (this.$refs.dropdownRef && !this.control.options.hasMultipleSelections) {
        this.$refs.dropdownRef.blur();
      }
      if (this.value !== value) {
        if (Array.isArray(value)) {
          this.changed(getValueOrNull(value.map(getValueOrNull)));
        } else {
          const nextValue = getValueOrNull(value);
          this.changed(nextValue ? [nextValue] : nextValue);
        }
      }
    },
    remove(item) {
      this.changed(getValueOrNull(this.value.filter((v) => v !== item.value)));
    },
    removeValue(value) {
      this.changed(getValueOrNull(this.value.filter((v) => v !== value)));
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
      return Array.isArray(this.value) ? this.value : this.value ? [this.value] : [];
    },
    getValue() {
      return this.control.options.hasMultipleSelections ? this.getArrayValue : this.getArrayValue[0] || this.value;
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
    getPlaceholder() {
      if ((this.control.hint && this.isFocus) || !this.control.hint) {
        if (!this.control.options.allowCustomSelection && !this.control.options.allowAutocomplete) {
          return this.control.options.hasMultipleSelections ? 'Select answers' : 'Select answer';
        } else if (!this.control.options.allowCustomSelection && this.control.options.allowAutocomplete) {
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
</style>
