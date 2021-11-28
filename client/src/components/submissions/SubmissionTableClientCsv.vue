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
      <template slot="item" slot-scope="props">
        <tr>
          <v-checkbox color="#777" multiple v-model="tableSelected" :value="id" class="custom-checkbox" />
          <td
            v-for="header in headers"
            :key="header.text"
            :class="truncate(props.item[header.value]) ? 'truncate' : ''"
            :data-value="props.item[header.value]"
          >
            {{ props.item[header.value] }}
          </td>
        </tr>
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

export function truncate(text, length, clamp) {
  if (text !== undefined) {
    clamp = clamp || '...';
    return text.length > length ? text.slice(0, length) + clamp : text;
  }
  return text;
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
      showDialog: false,
      textTruncateLength: 36,
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
        return this.parsed.data.map((n) => {
          return n;
        });
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
    truncate(value) {
      return value.length > this.textTruncateLength;
    },
    onRowSelected({ value, item }) {
      console.log({ value });
    },
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

          headers.push({
            text: header,
            value: header,
            filter: this.createCustomFilter(header),
            class: 'custom-header-class',
          });
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
.v-data-table >>> td {
  font-family: monospace;
}

.archived {
  color: #777 !important;
}

.v-data-table >>> td {
  white-space: nowrap;
}

.v-data-table >>> .custom-header-class span {
  display: inline-block;
  max-width: 190px;
}
.v-data-table {
  position: relative;
}

.truncate {
  cursor: pointer;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.truncate::before {
  content: '';
  position: absolute;
  left: 0;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}
.truncate::after {
  content: attr(data-value);
  position: absolute;
  left: 0;
  top: -2.5rem;
  font-size: 0.85rem;
  background: white;
  border-radius: 5px;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  padding: 1rem 1.5rem 1rem 1.5rem;
}
.truncate:hover::before,
.truncate:hover::after {
  opacity: 1;
  box-shadow: 0 19px 38px rgba(0, 0, 0, 0.3), 0 15px 12px rgba(0, 0, 0, 0.22);
  position: absolute;
  z-index: 20;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  white-space: initial;
  font-family: system-ui, -apple-system;
  line-height: 25px;
}

.custom-checkbox {
  margin-left: 1rem;
}
</style>
