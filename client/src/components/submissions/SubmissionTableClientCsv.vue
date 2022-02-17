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
      ref="table"
    >
      <template v-slot:top>
        <v-toolbar flat class="my-5">
          <v-row>
            <v-col>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <v-switch
                    :input-value="excludeMeta"
                    @change="$emit('excludeMetaChange', $event)"
                    label="Hide meta"
                    class="mt-2"
                  ></v-switch>
                </div>

                <div class="d-flex align-center" v-if="selected.length > 0">
                  <div>
                    <span class="subtitle-2">ACTIONS</span><br />{{ selected.length }}
                    {{ selected.length === 1 ? 'submission' : 'submissions' }} selected
                  </div>
                  <div class="ml-auto d-flex flex-column flex-sm-row">
                    <v-btn
                      v-if="selected[0]['meta.archived'] === 'true'"
                      :disabled="actionsAreDisabled"
                      color="error"
                      text
                      @click="$emit('showDeleteModal', $event)"
                    >
                      DELETE
                    </v-btn>
                    <v-btn
                      v-if="selected[0]['meta.archived'] === 'true'"
                      :disabled="actionsAreDisabled"
                      text
                      @click="$emit('archiveSubmissions', $event)"
                    >
                      RESTORE
                    </v-btn>
                    <v-btn
                      v-if="selected[0]['meta.archived'] !== 'true'"
                      :disabled="actionsAreDisabled"
                      color="error"
                      text
                      @click="$emit('showArchiveModal', $event)"
                    >
                      ARCHIVE
                    </v-btn>
                    <v-btn @click="$emit('reassignment', $event)" :disabled="actionsAreDisabled" text color="secondary"
                      >REASSIGN</v-btn
                    >
                    <v-btn
                      v-if="selected[0]['meta.archived'] !== 'true' && selected.length === 1"
                      :disabled="actionsAreDisabled"
                      text
                      color="primary"
                      @click="$emit('resubmit', $event)"
                    >
                      RESUBMIT
                    </v-btn>
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-toolbar>
      </template>

      <template v-for="header in headers" v-slot:[`header.${header.value}`]>
        <span
          :key="header.value"
          @click.stop="showFull(header.value, header.value, $event)"
          :class="{ activeHeader: isModalOpen(header.value) }"
        >
          <div :class="shouldTruncate(header.value) ? 'truncate-header' : 'non-truncated-header'">
            {{ header.value }}
          </div>
          <submission-table-cell-modal
            v-if="isModalOpen(header.value)"
            :value="header.value"
            @close="closeModal"
            :left="modalLeftPosition"
          />
        </span>
      </template>

      <template v-slot:body="props">
        <tbody>
          <tr v-for="item in props.items" :key="item._id">
            <td>
              <v-checkbox
                v-model="tableSelected"
                :value="item"
                color="#777"
                class="custom-checkbox"
                hide-details
                role="checkbox"
              />
            </td>
            <td
              v-for="header in headers"
              :key="header.text"
              @click.stop="showFullCell(item, header, $event)"
              :class="{ active: isModalOpen(getCellKey(header.value, item._id)) }"
            >
              <div :class="{ truncate: shouldTruncate(item[header.value]) }">
                {{ item[header.value] }}
              </div>
              <submission-table-cell-modal
                v-if="isModalOpen(getCellKey(header.value, item._id))"
                @close="closeModal"
                :value="item[header.value]"
                :showCopyButton="true"
                :left="modalLeftPosition"
              />
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
import SubmissionTableCellModal from './SubmissionTableCellModal.vue';

export function transformHeaders(headers) {
  const replaceGeoJsonPath = (str) => str.replace(/(value\.features\.\d).*/, '$1');
  // Remove GeoJSON question type paths from headers
  return Array.isArray(headers) ? [...new Set(headers.map(replaceGeoJsonPath))] : headers;
}

export function getCellKey(headerValue, itemId) {
  return `${headerValue}_${itemId}`;
}

export default {
  components: {
    SubmissionTableCellModal,
  },
  props: {
    actionsAreDisabled: {
      type: Boolean,
    },
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
    excludeMeta: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      activeTableCell: null,
      textTruncateLength: 36,
      csv: null,
      parsed: null,
      search: '',
      searchFields: {
        survey: '',
      },
      headers: [],
      modalLeftPosition: null,
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
  },
  methods: {
    getCellKey,
    shouldTruncate(value) {
      return value.length > this.textTruncateLength;
    },
    showFull(value, id, ev) {
      if (value.length > this.textTruncateLength) {
        this.activeTableCell = id;
        this.modalLeftPosition =
          ev.target.getBoundingClientRect().left - this.$refs.table.$el.getBoundingClientRect().left;
      }
    },
    showFullCell(item, header, ev) {
      this.showFull(item[header.value], this.getCellKey(header.value, item._id), ev);
    },
    isModalOpen(id) {
      return this.activeTableCell === id;
    },
    isCellModalOpen(header, item) {
      return this.isModalOpen(getCellKey(header.value, item._id));
    },
    closeModal() {
      this.activeTableCell = null;
      this.modalLeftPosition = null;
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
.v-data-table >>> th {
  white-space: nowrap;
}
.archived {
  color: #777 !important;
}

.custom-checkbox {
  margin-top: -0.3rem;
}

.truncate {
  cursor: pointer;
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.non-truncated-header {
  margin-top: 5px;
  display: inline-block;
}

/* header modal styles */
.truncate-header {
  display: inline-block;
  cursor: pointer;
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 5px;
}

.active,
.activeHeader {
  background-color: #d8d5d5;
}
.activeHeader {
  padding: 0.9rem 0;
}
</style>
