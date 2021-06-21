<template>
  <div class="ontology question">
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
    />
    <v-autocomplete
      v-if="sourceIsValid && !control.options.allowCustomSelection"
      :value="getValue"
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
      class="full-width"
      hide-details
      single-line
      data-test-id="autocomplete"
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
        </v-list-item-content>
      </template>
    </v-autocomplete>
    <v-combobox
      v-else-if="sourceIsValid && control.options.allowCustomSelection"
      :value="getValue"
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
      data-test-id="combobox"
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
      <template
        v-slot:item="data"
        v-if="!!control.options.hasMultipleSelections"
      >
        <v-list-item-content>
          <v-list-item-title v-html="data.item.label" />
        </v-list-item-content>
      </template>
    </v-combobox>
    <v-banner v-else-if="isLoading">
      <v-icon class="mr-2 mdi-spin">mdi-loading</v-icon>Loading
    </v-banner>
    <v-banner
      v-else
      color="red lighten-2"
      dark
    >
      <v-icon class="mr-2">mdi-alert</v-icon>Invalid select options, please update Survey Definition
    </v-banner>
    <app-control-more-info :value="control.moreInfo" />

  </div>
</template>

<script>
import { groupBy, map } from 'lodash';
import baseQuestionComponent from './BaseQuestionComponent';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
import { getValueOrNull, getNested } from '@/utils/surveyStack';
import { resourceTypes } from '@/utils/resources';
import api from '@/services/api.service';


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
    async fetchSubmissions(surveyId, path) {
      const base = `&project={"${path}.value":1}`;
      const query = base;
      const r = await api.get(`/submissions?survey=${surveyId}${query}`);
      const { data } = r;
      const items = data.map((item) => {
        const value = getNested(item, `${path}.value`, null);
        return {
          id: item._id,
          label: JSON.stringify(value).replace(/^"(.+(?="$))"$/, '$1'),
          value,
        };
      }).filter(item => item.value !== null);

      // const explodeItem = item => item.value.map((v, i) => ({
      //   id: `${item.id}__${i}`,
      //   label: JSON.stringify(v).replace(/^"(.+(?="$))"$/, '$1'),
      //   value: v,
      // }));

      // const explodedItems = items
      //   .map(it => (Array.isArray(it.value) ? explodeItem(it) : [it]))
      //   .reduce((acc, curr) => [...acc, ...curr], []);

      // console.log('exploded', explodedItems);

      const uniqueItems = Object.values(groupBy(items, 'value'))
        .map(group => ({
          ...group[0],
          // count: group.length,
          label: `${group[0].label}${group.length > 1 ? ` (${group.length})` : ''}`,
        }));
      return uniqueItems;
    },

  },
  computed: {
    getValue() {
      return this.control.options.hasMultipleSelections
        ? this.value
        : this.value && this.value[0];
    },
    resource() {
      return this.resources.find(r => r.id === this.control.options.source);
    },
    hasReference() {
      return !!this.resource && this.resource.type === resourceTypes.SURVEY_REFERENCE;
    },
    items() {
      if (this.hasReference) {
        return this.submissionItems;
      }

      return (this.resource && this.resource.content) || [];
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
  async mounted() {
    if (this.resource && this.hasReference) {
      const { id, path } = this.resource.content;
      this.isLoading = true;
      try {
        this.submissionItems = await this.fetchSubmissions(id, path);
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
</style>
