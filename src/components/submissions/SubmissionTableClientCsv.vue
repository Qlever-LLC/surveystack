<template>
  <v-card>
    <v-data-table
      :headers="headers"
      :items="items"
      show-select
      item-key="_id"
      :search="search"
      :mobile-breakpoint="0"
      hide-default-footer
      v-model="tableSelected"
      @item-selected="onRowSelected"
      disable-pagination
      :class="{ archived }"
      :server-items-length="submissions.pagination.total"
      @update:sort-by="onUpdateSortBy"
      @update:sort-desc="onUpdateSortDesc"
      multi-sort
      :sort-by="dataTableProps.sortBy"
      :sort-desc="dataTableProps.sortDesc"
      :loading="loading"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-row>
            <v-col>
              <div class="d-flex justify-end">
                <v-switch v-model="excludeMeta" label="Hide meta" class="mt-2"></v-switch>
              </div>
            </v-col>
          </v-row>
        </v-toolbar>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
import papa from 'papaparse';
import csvService from '@/services/csv.service';

export function transformHeaders(headers) {
  const replaceGeoJsonPath = (str) => str.replace(/(value\.features\.\d).*/, '$1');
  // Remove GeoJSON question type paths from headers
  return Array.isArray(headers) ? [...new Set(headers.map(replaceGeoJsonPath))] : headers;
}

export default {
  props: {
    submissions: {
      type: Object,
    },
    selected: {
      type: Array,
      required: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    dataTableProps: {
      type: Object,
      default() {
        return {
          sortBy: [],
          sortDesc: [],
        };
      },
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      excludeMeta: true,
      csv: null,
      parsed: null,
      search: '',
      searchFields: {
        survey: '',
      },
      headers: [],
    };
  },
  computed: {
    items() {
      if (this.parsed) {
        return this.parsed.data;
      }
      return [];
    },
    tableSelected: {
      get() {
        return this.selected;
      },
      set(newValue) {
        this.$emit('update:selected', newValue);
      },
    },
  },
  watch: {
    excludeMeta() {
      this.createHeaders();
    },
    submissions() {
      this.fetchData();
    },
    selected(newVal) {
      // see 'sync' modifier
      // https://vuejs.org/v2/guide/components-custom-events.html
      // this.$emit('update:selected', this.selected);
    },
  },
  methods: {
    onRowSelected({ value, item }) {},
    createCustomFilter(field) {
      return (value, search, item) => {
        if (!this.searchFields[field]) {
          return true;
        }

        return value.toLowerCase().startsWith(this.searchFields[field].toLowerCase());
      };
    },
    createHeaders() {
      const headers = [];
      if (this.parsed) {
        this.parsed.meta.fields.forEach((header) => {
          if (this.excludeMeta && (header.startsWith('meta') || header.includes('meta'))) {
            return;
          }
          this.$set(this.searchFields, header, ''); // v-data-table search/filter is not used at this moment
          headers.push({ text: header, value: header, filter: this.createCustomFilter(header) });
        });
      }
      this.headers = headers;
    },
    onUpdateSortBy(value) {
      this.$emit('onDataTablePropsChanged', { ...this.dataTableProps, sortBy: value });
    },
    onUpdateSortDesc(value) {
      this.$emit('onDataTablePropsChanged', { ...this.dataTableProps, sortDesc: value });
    },
    async fetchData() {
      if (!this.submissions) {
        return;
      }
      const headers = transformHeaders(this.submissions.headers);
      this.csv = csvService.createCsv(this.submissions.content, headers);
      this.parsed = papa.parse(this.csv, { header: true });
      this.createHeaders();
    },
  },
  async created() {
    this.fetchData();
  },
};
</script>

<style scoped>
/* https://vue-loader.vuejs.org/guide/scoped-css.html#child-component-root-elements */
.v-data-table >>> td {
  font-family: monospace;
}

/*
.v-data-table >>> .v-label {
  font-size: 12px;
}
*/
</style>

<style scoped>
.archived {
  color: #777 !important;
}

.v-data-table >>> td {
  white-space: nowrap;
  /* max-width: 1px;
  overflow: hidden;
  text-overflow: ellipsis; */
}

.v-data-table-truncated >>> td {
  white-space: nowrap;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
}

td.untruncated {
  white-space: normal;
  max-width: 250px;
  overflow: visible;
  text-overflow: unset;
}
</style>
