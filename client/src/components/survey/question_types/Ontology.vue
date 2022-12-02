<template>
  <div class="ontology question">
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <v-select
      v-if="sourceIsValid && !control.options.allowCustomSelection && !control.options.allowAutocomplete"
      :value="getValue"
      @change="
        (v) => {
          onChange(v);
        }
      "
      :items="items"
      item-text="label"
      item-value="value"
      hide-details
      outlined
      :chips="!!control.options.hasMultipleSelections"
      :label="control.hint"
      :multiple="!!control.options.hasMultipleSelections"
      class="full-width dropdown"
      data-test-id="dropdown"
      color="focus"
      placeholder="Select answer"
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
      v-else-if="sourceIsValid && !control.options.allowCustomSelection && control.options.allowAutocomplete"
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
      outlined
      :chips="!!control.options.hasMultipleSelections"
      :label="control.hint"
      :multiple="!!control.options.hasMultipleSelections"
      :menu-props="autocompleteMenuProps"
      class="full-width dropdown"
      hide-details
      single-line
      data-test-id="autocomplete"
      color="focus"
      placeholder="Type to search"
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
      v-else-if="sourceIsValid && control.options.allowCustomSelection"
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
      :chips="!!control.options.hasMultipleSelections"
      :label="control.hint"
      :multiple="!!control.options.hasMultipleSelections"
      ref="input"
      class="full-width custom-ontology dropdown"
      outlined
      hide-details
      single-line
      data-test-id="combobox"
      color="focus"
      placeholder="Type to search or add custom answer"
    >
      <template v-slot:selection="data">
        <v-chip
          v-bind="data.attrs"
          :input-value="data.selected"
          close
          @click="data.select"
          @click:close="removeValue(data.item)"
          v-if="!!control.options.hasMultipleSelections"
        >
          {{ getLabelForItemValue(data.item) }}
        </v-chip>
        <div v-else>
          {{ getLabelForItemValue(data.item) }}
        </div>
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
    <v-banner v-else-if="isLoading"> <v-icon class="mr-2 mdi-spin">mdi-loading</v-icon>Loading </v-banner>
    <v-banner v-else color="red lighten-2" dark>
      <v-icon class="mr-2">mdi-alert</v-icon>Invalid select options, please update Survey Definition
    </v-banner>
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import { groupBy, isNil, sortBy, uniq, without } from 'lodash';
import baseQuestionComponent from './BaseQuestionComponent';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
import { getValueOrNull, getNested } from '@/utils/surveyStack';
import { resourceTypes } from '@/utils/resources';
import api from '@/services/api.service';

export async function fetchSubmissions(apiService, surveyId, path) {
  const query = `&project={"${path}.value":1}`;
  const { data } = await apiService.get(`/submissions?survey=${surveyId}${query}`);
  const items = data
    .map((item) => {
      const value = getNested(item, `${path}.value`, null);
      return {
        id: item._id,
        label: JSON.stringify(value).replace(/^"(.+(?="$))"$/, '$1'),
        value,
      };
    })
    .filter((item) => item.value !== null);

  const explodeItem = (item) =>
    item.value
      .map((v, i) => ({
        id: `${item.id}__${i}`,
        // stringify and remove wrapping quote characters so that strings are rendered without quotation marks
        label: JSON.stringify(v).replace(/^"(.+(?="$))"$/, '$1'),
        value: v,
      }))
      .filter((v) => v.value);

  const explodedItems = items
    .map((it) => (Array.isArray(it.value) ? explodeItem(it) : [it]))
    .reduce((acc, curr) => [...acc, ...curr], []);

  const uniqueItems = Object.values(groupBy(explodedItems, 'label')).map((group) => ({
    ...group[0],
    label: group[0].label,
    count: group.length,
  }));
  return uniqueItems;
}

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
    };
  },
  methods: {
    getValueOrNull,
    onChange(v) {
      if (this.value !== v) {
        if (Array.isArray(v)) {
          this.changed(this.getValueOrNull(v.sort()));
        } else {
          const nextValue = this.getValueOrNull(v);
          this.changed(nextValue ? [nextValue] : nextValue);
        }
      }
    },
    remove(item) {
      this.changed(this.getValueOrNull(this.value.filter((v) => v !== item.value)));
    },
    removeValue(value) {
      this.changed(this.getValueOrNull(this.value.filter((v) => v !== value)));
    },
    getLabelForItemValue(value) {
      const item = this.items.find((x) => x.value === value);
      return (item && item.label) || value;
    },
    fetchSubmissions,
  },
  computed: {
    getValue() {
      const aryValue = Array.isArray(this.value) ? this.value : this.value ? [this.value] : [];
      return this.control.options.hasMultipleSelections ? aryValue : aryValue[0] || this.value;
    },
    resource() {
      return this.resources.find((r) => r.id === this.control.options.source);
    },
    hasReference() {
      return !!this.resource && this.resource.type === resourceTypes.SURVEY_REFERENCE;
    },
    items() {
      const defaultItems = this.hasReference ? this.submissionItems : this.resource ? this.resource.content : [];
      const usedValues = Array.isArray(this.value) ? this.value : this.value ? [this.value] : [];
      // All the custom items the users typed in
      const customItems = without(
        uniq(usedValues).filter((v) => !isNil(v)), // get all the uniq non-empty values
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
    if (this.resource && this.hasReference) {
      const { id, path } = this.resource.content;
      this.isLoading = true;
      try {
        this.submissionItems = await this.fetchSubmissions(api, id, path);
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
</style>
