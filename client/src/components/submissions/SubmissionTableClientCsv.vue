<template>
  <v-card id="container">
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
            <td v-for="header in headers" :key="header.text" @click.stop="showFullText(item[header.value], $event)">
              <div :class="truncate(item[header.value]) ? 'truncate' : ''">
                {{ item[header.value] }}
              </div>
            </td>
          </tr>
        </tbody>
      </template>
    </v-data-table>

    <div
      v-if="isSnackbarVisible"
      :style="{
        left: `${truncatedPosition[0]}px`,
        top: `${truncatedPosition[1]}px`,
        position: 'absolute',
        transorm: 'translate(-50%, -50%)',
      }"
    >
      <span class="black--text">{{ truncatedValue }}</span>
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
      isSnackbarVisible: false,
      truncatedPosition: [0, 0],
      truncatedValue: '',
      iconColor: 'grey lighten-1',
      checkedNames: [],
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
    showFullText(value, event) {
      console.log(event, 'event');
      if (value.length > this.textTruncateLength) {
        this.truncatedValue = value;
        this.isSnackbarVisible = !this.isSnackbarVisible;
        this.truncatedPosition = [event.pageX, event.pageY];
      }
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
  mounted() {
    document.addEventListener('click', (event) => {
      if (!document.getElementsByClassName('snackbar')[0].contains(event.target)) {
        this.isSnackbarVisible = false;
      }
    });
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

.truncate {
  cursor: pointer;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-checkbox {
  margin-top: -0.3rem;
}
</style>
