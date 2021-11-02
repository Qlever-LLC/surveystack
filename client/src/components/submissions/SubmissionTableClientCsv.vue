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
        <tr v-for="id in items" :key="id.text">
          <v-checkbox color="#777" multiple v-model="tableSelected" :value="id" class="custom-checkbox" />
          <td
            v-for="header in headers"
            :key="header.text"
            class="truncate"
            @click="showDetails(props.item[header.value], header)"
          >
            {{ truncateMethod(props.item[header.value], textTruncateLength, '...') }}
          </td>
        </tr>
      </template>
    </v-data-table>

    <div class="text-center">
      <v-snackbar :timeout="-1" v-model="snackbar" color="white" elevation="24" absolute top>
        <span class="black--text">{{ fullText }}</span>
      </v-snackbar>
    </div>
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
      snackbar: false,
      showDialog: false,
      fullText: '',
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
    truncateMethod(text, length, clamp) {
      return truncate(text, length, clamp);
    },
    showDetails(value, { text }) {
      if (value.length > this.textTruncateLength) {
        this.toggleSnackBar();
        this.fullText = value;
      }
    },
    toggleSnackBar() {
      this.snackbar = !this.snackbar;
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

.v-data-table >>> .custom-header-class span {
  display: inline-block;
  max-width: 190px;
}
.truncate {
  cursor: pointer;
}
.custom-checkbox {
  margin-left: 1rem;
}
</style>
