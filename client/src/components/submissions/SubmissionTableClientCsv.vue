<template>
  <v-card>
    <v-data-table
      ref="table"
      v-model="tableSelected"
      :class="{ archived }"
      :mobile-breakpoint="0"
      :headers="headers"
      :items="items"
      item-key="_id"
      :loading="loading"
      :search="search"
      :server-items-length="submissions.pagination.total"
      :sort-by="dataTableProps.sortBy"
      :sort-desc="dataTableProps.sortDesc"
      @update:sort-by="onUpdateSortBy"
      @update:sort-desc="onUpdateSortDesc"
      show-select
      multi-sort
      disable-pagination
      :hide-default-header="headers.length === 0"
      hide-default-footer
    >
      <template v-slot:top>
        <v-toolbar flat class="my-5">
          <v-row>
            <v-col>
              <div class="d-flex justify-space-between align-center">
                <div class="d-flex justify-space-between align-center mt-5">
                  <v-switch
                    :input-value="!excludeMeta"
                    @change="$emit('excludeMetaChange', $event)"
                    label="Show metadata"
                    class="mt-2"
                  ></v-switch>
                  <v-switch
                    :input-value="archived"
                    @change="$emit('showArchived', $event)"
                    label="View archived only"
                    class="mt-2 ml-5"
                  ></v-switch>
                  <v-switch
                    :input-value="isExpandMatrix"
                    @change="isExpandMatrix = $event"
                    label="Expand matrix questions"
                    class="mt-2 ml-5"
                  ></v-switch>
                </div>
                <div class="d-flex align-center" v-if="selected.length > 0">
                  <div>
                    {{ `${selected.length} ${selected.length === 1 ? 'submission' : 'submissions'} selected` }}
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
          @click.stop="openModal($event, [header.text, -1, header.value])"
          :class="{ activeHeader: isModalOpen([header.text, -1, header.value]) }"
        >
          <div :class="shouldTruncate(header.value) ? 'truncate-header' : 'non-truncated-header'">
            {{ header.text }}
          </div>
        </span>
      </template>

      <template v-slot:item="{ item, index, isSelected, select }">
        <tr :key="item._id">
          <td :class="{ 'expand-cell': isExpandMatrix }">
            <v-checkbox
              :value="isSelected"
              @click="select(!isSelected)"
              color="#777"
              class="custom-checkbox"
              hide-details
              role="checkbox"
            />
          </td>
          <td
            v-for="header in headers"
            :key="header.text"
            @click.stop="openModal($event, [getCellValue(item, header.value), index, header.value], true)"
            :class="{
              active: isModalOpen([getCellValue(item, header.value), index, header.value]),
              'expand-cell': isExpandMatrix,
            }"
          >
            <table v-if="Array.isArray(item[header.value])" width="100%" cellSpacing="0" class="mt-6">
              <tr
                v-for="(child, i) in item[header.value]"
                :key="i"
                :class="{
                  'last-row': item[header.value].length === item.count,
                }"
              >
                <td
                  class="matrix-cell"
                  :class="{
                    active: isModalOpen([child, index, header.value, i]),
                  }"
                  @click.stop="openModal($event, [getCellValue(child), index, header.value, i], true)"
                >
                  <div :class="{ truncate: shouldTruncate(child) }">
                    {{ getCellValue(child) }}
                  </div>
                </td>
              </tr>
            </table>
            <div
              v-else-if="item[header.value].includes('resources/')"
              :class="{ truncate: shouldTruncate(getLabelFromKey(item[header.value])) }"
            >
              <a @click.stop="openResource(item[header.value])"> {{ getLabelFromKey(item[header.value]) }}</a>
            </div>
            <div v-else :class="{ truncate: shouldTruncate(item[header.value]) }">
              {{ getCellValue(item, header.value) }}
            </div>
          </td>
        </tr>
      </template>
    </v-data-table>

    <submission-table-cell-modal
      v-if="cellText"
      :value="cellText"
      :left="modalLeftPosition"
      :top="modalTopPosition"
      :showCopyButton="modalShowCopyButton"
      @close="closeModal"
    />

    <v-dialog :value="downloadingResource" hide-overlay persistent width="300" role="downloadingResourceProgressDialog">
      <v-card>
        <v-card-text class="pa-4">
          <span>Downloading file resource</span>
          <v-progress-linear indeterminate class="mb-0" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-alert v-if="openResourceError" type="warning" dismissible>
      {{ openResourceError }}
    </v-alert>
  </v-card>
</template>
<script>
import papa from 'papaparse';
import csvService from '@/services/csv.service';
import SubmissionTableCellModal from './SubmissionTableCellModal.vue';
import { getLabelFromKey, openResourceInTab } from '@/utils/resources';
import moment from 'moment';
import cloneDeep from 'lodash/cloneDeep';
import omit from 'lodash/omit';

export function getPropertiesFromMatrix(headers, matrix) {
  if (!Array.isArray(headers) || typeof matrix !== 'string') {
    return [];
  }
  const key = `${matrix}.0.`;
  const matches = headers.filter((header) => header.startsWith(key));
  const properties = matches.map((header) => header.substring(key.length));
  return properties;
}

export function transformGeoJsonHeaders(headers) {
  if (!Array.isArray(headers)) {
    return headers;
  }

  // Remove GeoJSON question type paths from headers
  const replaceGeoJsonPath = (str) => str.replace(/(value\.features\.\d).*/, '$1');
  return [...new Set(headers.map(replaceGeoJsonPath))];
}

function matrixHeadersFromSubmission(submission, parentKey = '') {
  const headers = [];
  Object.entries(submission.data || {}).forEach(([key, value]) => {
    const type = typeof value.meta === 'object' ? value.meta.type : '';
    if (type === 'page' || type === 'group') {
      const data = cloneDeep(omit(value, 'meta'));
      headers.push(...matrixHeadersFromSubmission({ data }, key));
    } else if (type === 'matrix') {
      headers.push(`data${parentKey ? `.${parentKey}` : ''}.${key}.value`);
    }
  });
  return headers;
}

export function transformMatrixHeaders(headers, submissions) {
  // Get matrix headers from submissions raw data by filtering "meta.type" = "matrix"
  let matrixHeaders = [];
  submissions.forEach((submission) => {
    matrixHeaders = [...new Set([...matrixHeaders, ...matrixHeadersFromSubmission(submission)])];
  });

  const result = [];
  headers.forEach((header) => {
    const matched = matrixHeaders.find((h) => header.startsWith(h));
    if (!matched) {
      result.push(header);
    } else if (!result.includes(matched)) {
      result.push(matched);
    }
  });

  return result;
}

const PREFERRED_HEADERS = ['_id', 'meta.creatorDetail.name', 'meta.dateSubmitted'];

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
      newData: this.archived,
      activeTableCell: [],
      textTruncateLength: 36,
      csv: null,
      parsed: null,
      search: '',
      searchFields: {
        survey: '',
      },
      headers: [],
      modalLeftPosition: null,
      modalTopPosition: null,
      modalShowCopyButton: false,
      downloadingResource: false,
      openResourceError: false,
      isExpandMatrix: true,
    };
  },
  computed: {
    items() {
      if (!this.parsed) {
        return [];
      }
      return this.parsed.data.map((item) => {
        const row = {};
        let count = 1;
        const columns = this.headers.map((header) => header.value);
        columns.forEach((header) => {
          if (header in item) {
            row[header] = item[header];
          } else {
            const [matrix, property] = header.split('-');
            const children = this.parsed.meta.fields
              .filter((r) => r.startsWith(matrix) && r.endsWith(property))
              .map((key) => item[key]);
            row[header] = this.isExpandMatrix ? children : JSON.stringify(children);
            if (this.isExpandMatrix && children.length > count) {
              count = children.length;
            }
          }
        });
        row.count = count;
        return row;
      });
    },
    tableSelected: {
      get() {
        return this.selected;
      },
      set(newValue) {
        this.$emit('update:selected', newValue);
      },
    },
    cellText() {
      const [value] = this.activeTableCell;
      return value || '';
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
    getLabelFromKey,
    getCellValue(item, header) {
      if (typeof item === 'string') {
        return item || ' ';
      }

      const value = item[header];
      if (typeof value !== 'string') {
        return ' ';
      }

      if (isNaN(Number(value)) && !isNaN(Date.parse(value))) {
        const dateValue = moment(value);
        return dateValue.format('MMM D, YYYY h:mm A');
      }
      return value;
    },
    shouldTruncate(value) {
      return value.length > this.textTruncateLength;
    },
    isModalOpen(value) {
      return JSON.stringify(this.activeTableCell) === JSON.stringify(value);
    },
    /*
     ** ev - event
     ** value - Array [text, row index, col name, cell array index]
     */
    openModal(ev, cell, showCopyButton = false) {
      const [value] = cell;
      if (value.length > this.textTruncateLength) {
        this.activeTableCell = cell;
        this.modalLeftPosition =
          ev.target.getBoundingClientRect().left - this.$refs.table.$el.getBoundingClientRect().left;
        this.modalTopPosition =
          ev.target.getBoundingClientRect().top - this.$refs.table.$el.getBoundingClientRect().top;
        this.modalShowCopyButton = showCopyButton;
      }
    },
    closeModal() {
      this.activeTableCell = [];
      this.modalLeftPosition = null;
      this.modalTopPosition = null;
      this.modalShowCopyButton = false;
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
        const rawHeaders = this.parsed.meta.fields;
        const matrixHeaders = transformMatrixHeaders(rawHeaders, this.submissions.content);
        PREFERRED_HEADERS.forEach((header) => {
          if (matrixHeaders.includes(header)) {
            headers.push({
              text: header,
              value: header,
              filter: this.createCustomFilter(header),
            });
          }
        });
        matrixHeaders.forEach((header) => {
          if (
            PREFERRED_HEADERS.includes(header) ||
            (this.excludeMeta && (header.startsWith('meta') || header.includes('meta')))
          ) {
            return;
          }
          this.$set(this.searchFields, header, ''); // v-data-table search/filter is not used at this moment

          if (rawHeaders.includes(header)) {
            headers.push({
              text: header,
              value: header,
              filter: this.createCustomFilter(header),
            });
          } else {
            const properties = getPropertiesFromMatrix(rawHeaders, header);
            headers.push(
              ...properties.map((h) => ({
                text: `${header}.${h}`,
                value: `${header}-${h}`,
                filter: this.createCustomFilter(`${header}-${h}`),
              }))
            );
          }
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
      const headers = transformGeoJsonHeaders(this.submissions.headers);
      this.csv = csvService.createCsv(this.submissions.content, headers);
      this.parsed = papa.parse(this.csv, { header: true });
      this.createHeaders();
    },
    async openResource(value) {
      this.downloadingResource = true;
      let resourceKeyParts = value.split('/');
      let resourceId = resourceKeyParts[resourceKeyParts.length - 2]; //resourceId is second last part of key
      try {
        await openResourceInTab(this.$store, resourceId);
      } catch (error) {
        this.openResourceError = 'File could not be opened';
      } finally {
        this.downloadingResource = false;
      }
    },
  },
  async created() {
    this.fetchData();
  },
};
</script>

<style scoped>
>>> .v-toolbar__content {
  background: #f5f5f5 !important;
}
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

.v-data-table >>> td.expand-cell {
  vertical-align: top;
  padding-top: 8px;
  padding-bottom: 8px;
  height: 24px;
}

.v-data-table >>> td.matrix-cell {
  position: relative;
  height: 24px;
  line-height: 24px;
}

.v-data-table >>> td.expand-cell tr td.matrix-cell div::after {
  content: '';
  position: absolute;
  left: -16px;
  right: -16px;
  top: 0;
  height: 100%;
  border-top: thin solid rgba(0, 0, 0, 0.12);
}

.v-data-table >>> td.expand-cell tr:not(.last-row):last-child td.matrix-cell div::after {
  height: calc(100% + 1px);
  border-bottom: thin solid rgba(0, 0, 0, 0.12);
}
</style>
