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

      <template v-slot:body="props">
        <tbody>
          <tr v-for="item in props.items" :key="item._id">
            <td>
              <v-checkbox v-model="tableSelected" :value="item" color="#777" class="custom-checkbox" hide-details />
            </td>
            <td v-for="header in headers" :key="header.text" @click="onClick">
              <div :class="truncate(item[header.value]) ? 'truncate' : ''">
                {{ item[header.value] }}
              </div>
              <div
                v-if="truncate(item[header.value])"
                :class="truncate(item[header.value]) ? 'truncate-full-text' : ''"
              >
                {{ item[header.value] }}
              </div>
            </td>
          </tr>
        </tbody>
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
      active: false,
      clickedColumn: '',
      iconColor: 'grey lighten-1',
      checkedNames: [],
      showDialog: false,
      textTruncateLength: 36,
      selecteds: [],
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
    onClick(event) {
      console.log(event);
    },
    handleClick(data) {
      this.selecteds.push([...this.selecteds, data.item]);
      this.$emit('update:selected', this.selecteds);
    },
    truncate(value, item) {
      return value.length > this.textTruncateLength;
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
  white-space: nowrap;
}

.archived {
  color: #777 !important;
}

.v-data-table >>> .custom-header-class span {
  display: inline-block;
  max-width: 250px;
}

tbody {
}
td {
  position: relative;
}

.truncate {
  cursor: pointer;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.truncate-full-text {
  position: absolute;
  top: -50%;
  left: 0;
  right: 0;
  bottom: 0;
  display: none;
  background-color: white;
  padding: 1rem 1rem 1rem 1rem;
  box-shadow: 0 19px 38px rgba(0, 0, 0, 0.3), 0 15px 12px rgba(0, 0, 0, 0.22);
  overflow: auto;
  height: 5rem;
  min-width: 600px;
  border-radius: 5px;
}

td:hover .truncate-full-text {
  opacity: 1;
  white-space: initial;
  top: -5rem;
  left: 0%;
  z-index: 1500;
  overflow: auto;
  display: block;
  width: 100%;
}

.custom-checkbox {
  margin-top: -0.3rem;
}
</style>
