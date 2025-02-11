<template>
  <a-card>
    <a-data-table-server
      ref="tableRef"
      v-model="tableSelected"
      :headerProps="{ archived }"
      :headers="state.headers"
      :items="items"
      itemValue="_id"
      :loading="loading"
      :search="state.search"
      :items-length="submissions.pagination.total"
      :sortBy="sortBy"
      @update:sortBy="onUpdateSortBy"
      :showSelect="state.headers.length !== 0"
      multiSort
      :headerSlot="state.headers.length !== 0">
      <template v-slot:top>
        <a-toolbar flat class="" cssBackgroundCream>
          <a-row>
            <a-col>
              <div class="d-flex justify-space-between align-center">
                <div class="d-flex justify-space-between align-center mt-5 ml-5">
                  <a-switch
                    :modelValue="!excludeMeta"
                    @update:modelValue="$emit('excludeMetaChange', $event)"
                    label="Show metadata"
                    class="mt-2" />
                  <a-switch
                    :modelValue="state.isExpandMatrix"
                    @update:modelValue="state.isExpandMatrix = $event"
                    label="Expand matrix questions"
                    class="mt-2 ml-5" />
                </div>
                <div class="d-flex align-center" v-if="selected.length > 0">
                  <div>
                    {{ `${selected.length} ${selected.length === 1 ? 'submission' : 'submissions'} selected` }}
                  </div>
                  <div class="ml-auto d-flex flex-column flex-sm-row">
                    <a-btn
                      v-if="selected[0]['meta.archived'] === 'true'"
                      :disabled="actionsAreDisabled"
                      color="error"
                      text
                      @click="$emit('showDeleteModal', $event)">
                      DELETE
                    </a-btn>
                    <a-btn
                      v-if="selected[0]['meta.archived'] === 'true'"
                      :disabled="actionsAreDisabled"
                      text
                      @click="$emit('archiveSubmissions', $event)">
                      RESTORE
                    </a-btn>
                    <a-btn
                      v-if="selected[0]['meta.archived'] !== 'true'"
                      :disabled="actionsAreDisabled"
                      color="error"
                      text
                      @click="$emit('showArchiveModal', $event)">
                      ARCHIVE
                    </a-btn>
                    <a-btn
                      @click="$emit('reassignment', $event)"
                      :disabled="actionsAreDisabled"
                      variant="text"
                      color="secondary"
                      >REASSIGN</a-btn
                    >
                    <a-btn
                      v-if="selected[0]['meta.archived'] !== 'true' && selected.length === 1"
                      :disabled="actionsAreDisabled"
                      text
                      color="primary"
                      @click="$emit('resubmit', $event)">
                      RESUBMIT
                    </a-btn>
                  </div>
                </div>
              </div>
            </a-col>
          </a-row>
        </a-toolbar>
      </template>

      <template v-slot:headers="{ columns, isSorted, getSortIcon, toggleSort }">
        <tr>
          <template v-for="(column, index) in columns" :key="column.key">
            <td v-if="index === 0">
              <a-checkbox
                :modelValue="selected.length === selectableItems.length"
                :indeterminate="selected.length > 0 && selected.length < selectableItems.length"
                @click="toggleSelectAllItems"
                color="#777"
                class="custom-checkbox"
                hide-details
                role="checkbox" />
            </td>
            <td v-else>
              <span class="mr-2 cursor-pointer" @click="() => toggleSort(column)">{{ column.title }}</span>
              <template v-if="isSorted(column)">
                <a-icon :icon="getSortIcon(column)"></a-icon>
              </template>
            </td>
          </template>
        </tr>
      </template>

      <template v-slot:item="{ item, index }">
        <tr :key="item._id">
          <td :class="{ 'expand-cell': state.isExpandMatrix }">
            <a-checkbox
              :modelValue="isSelected(item)"
              :disabled="!isSelectable(item)"
              @click="toggleSelect(item)"
              color="#777"
              class="custom-checkbox"
              hide-details
              role="checkbox" />
          </td>
          <td
            v-for="(header, indx) in state.headers"
            :key="header.title"
            @click.stop="openModal($event, [getCellValue(item, indx, header.value), index, header.value], true)"
            :class="{
              active: isModalOpen([getCellValue(item, indx, header.value), index, header.value]),
              'expand-cell': state.isExpandMatrix,
            }">
            <table v-if="Array.isArray(item[header.value])" width="100%" cellSpacing="0" class="mt-6">
              <tr
                v-for="(child, i) in item[header.value]"
                :key="i"
                :class="{
                  'last-row': item[header.value].length === item.count,
                }">
                <td
                  class="matrix-cell"
                  :class="{
                    active: isModalOpen([child, index, header.value, i]),
                  }"
                  @click.stop="openModal($event, [getCellValue(child, indx), index, header.value, i], true)">
                  <div :class="{ truncate: shouldTruncate(child) }">
                    {{ getCellValue(child, indx) }}
                  </div>
                </td>
              </tr>
            </table>
            <div
              v-else-if="item[header.value].includes('resources/')"
              :class="{ truncate: shouldTruncate(getLabelFromKey(item[header.value])) }">
              <a @click.stop="openResource(item[header.value])"> {{ getLabelFromKey(item[header.value]) }}</a>
            </div>
            <div v-else :class="{ truncate: shouldTruncate(item[header.value]) }">
              {{ getCellValue(item, indx, header.value) }}
            </div>
          </td>
        </tr>
      </template>
    </a-data-table-server>

    <submission-table-cell-modal
      v-if="cellText"
      :value="cellText"
      :left="state.modalLeftPosition"
      :top="state.modalTopPosition"
      :showCopyButton="state.modalShowCopyButton"
      @close="closeModal" />

    <a-dialog :modelValue="state.downloadingResource" persistent width="300" role="downloadingResourceProgressDialog">
      <a-card>
        <a-card-text class="pa-4">
          <span>Downloading file resource</span>
          <a-progress-linear class="mb-0" />
        </a-card-text>
      </a-card>
    </a-dialog>

    <a-alert v-if="state.openResourceError" type="warning" closable>
      {{ state.openResourceError }}
    </a-alert>
  </a-card>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue';
import { useStore } from 'vuex';
import papa from 'papaparse';
import csvService from '@/services/csv.service';
import SubmissionTableCellModal from './SubmissionTableCellModal.vue';
import { getLabelFromKey, openResourceInTab } from '@/utils/resources';
import {
  transformMatrixHeaders,
  getCellValue,
  getPropertiesFromMatrix,
  transformGeoJsonHeaders,
  PREFERRED_HEADERS,
} from './SubmissionTableClientCsv';
import { getPermission } from '../../utils/permissions'

const store = useStore();
const tableRef = ref(null);
const { rightToManageSubmission } = getPermission();

const MATRIX_SEPARATOR = '===>';

const emit = defineEmits([
  'excludeMetaChange',
  'showDeleteModal',
  'archiveSubmissions',
  'showArchiveModal',
  'reassignment',
  'resubmit',
  'update:selected',
  'onDataTablePropsChanged',
]);

const props = defineProps({
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
  sortBy: {
    type: Array,
    required: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  excludeMeta: {
    type: Boolean,
    default: true,
  },
});

const state = reactive({
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
});

const items = computed(() => {
  if (!state.parsed) {
    return [];
  }
  return state.parsed.data.map((item) => {
    const row = {};
    let count = 1;
    const columns = state.headers.map((header) => header.value);
    columns.forEach((header) => {
      if (header in item) {
        row[header] = item[header];
      } else {
        const [matrix, property] = header.split(MATRIX_SEPARATOR);
        const children = state.parsed.meta.fields
          .filter((r) => {
            const matrixMatch = r.startsWith(matrix);
            const propertyMatch = r.endsWith(property) && /^.\d.$/g.test(r.slice(matrix.length, -property.length));
            return matrixMatch && propertyMatch;
          })
          .sort((a, b) => {
            const aIndex = Number(a.substring(matrix.length + 1, a.length - property.length - 1));
            const bIndex = Number(b.substring(matrix.length + 1, b.length - property.length - 1));
            if (isNaN(aIndex) || isNaN(bIndex)) {
              return a.localeCompare(b);
            } else {
              return aIndex - bIndex;
            }
          })
          .map((key) => item[key]);
        row[header] = state.isExpandMatrix ? children : JSON.stringify(children);
        if (state.isExpandMatrix && children.length > count) {
          count = children.length;
        }
      }
    });
    row.count = count;
    return row;
  });
})

const tableSelected = computed({
  get() {
    return props.selected;
  },
  set(newValue) {
    emit('update:selected', newValue);
  },
});

const cellText = computed(() => {
  const [value] = state.activeTableCell;
  return value || '';
});

const selectableItems = computed(() => {
  return items.value.filter((item) => isSelectable(item));
});

const user = computed(() => {
  return store.getters['auth/user'];
});

const userMemberships = computed(() => {
  return store.getters['memberships/memberships'];
});

function shouldTruncate(value) {
  return value.length > state.textTruncateLength;
};

function isModalOpen(value) {
  return JSON.stringify(state.activeTableCell) === JSON.stringify(value);
};

function openModal(ev, cell, showCopyButton = false) {
  const [value] = cell;
  if (value.length > state.textTruncateLength) {
    state.activeTableCell = cell;
    state.modalLeftPosition =
      ev.target.getBoundingClientRect().left - tableRef.value.$el.getBoundingClientRect().left;
    state.modalTopPosition =
      ev.target.getBoundingClientRect().top - tableRef.value.$el.getBoundingClientRect().top;
    state.modalShowCopyButton = showCopyButton;
  }
};

function closeModal() {
  state.activeTableCell = [];
  state.modalLeftPosition = null;
  state.modalTopPosition = null;
  state.modalShowCopyButton = false;
};

function createCustomFilter(field) {
  return (value) => {
    if (!state.searchFields[field]) {
      return true;
    }
    return value.toLowerCase().startsWith(state.searchFields[field].toLowerCase());
  };
};

function createHeaders() {
  const headers = [];
  if (state.parsed) {
    const rawHeaders = state.parsed.meta.fields;
    const matrixHeaders = transformMatrixHeaders(rawHeaders, props.submissions.content);
    PREFERRED_HEADERS.forEach((header) => {
      headers.push({
        title: header,
        value: header,
        filter: createCustomFilter(header),
      });
    });
    matrixHeaders.forEach((header) => {
      if (
        PREFERRED_HEADERS.includes(header) ||
        (props.excludeMeta && (header.startsWith('meta') || header.includes('meta')))
      ) {
        return;
      }
      state.searchFields[header] = ''; // v-data-table search/filter is not used at this moment

      if (rawHeaders.includes(header)) {
        headers.push({
          title: header,
          value: header,
          filter: createCustomFilter(header),
        });
      } else {
        const properties = getPropertiesFromMatrix(rawHeaders, header);
        headers.push(
          ...properties.map((h) => ({
            title: `${header}.${h}`,
            value: [header, h].join(MATRIX_SEPARATOR),
            filter: createCustomFilter([header, h].join(MATRIX_SEPARATOR)),
          }))
        );
      }
    });
  }
  state.headers = headers;
};

function onUpdateSortBy(value) {
  emit('onDataTablePropsChanged', value);
};

async function fetchData() {
  if (!props.submissions) {
    return;
  }
  const headers = transformGeoJsonHeaders(props.submissions.headers);
  if (props.submissions.content.length > 0) {
    state.csv = csvService.createCsv(props.submissions.content, headers);
    state.parsed = papa.parse(state.csv, { header: true });
  }
  createHeaders();
};

async function openResource(value) {
  state.downloadingResource = true;
  let resourceKeyParts = value.split('/');
  let resourceId = resourceKeyParts[resourceKeyParts.length - 2]; //resourceId is second last part of key
  try {
    await openResourceInTab(store, resourceId);
  } catch (error) {
    state.openResourceError = 'File could not be opened';
  } finally {
    state.downloadingResource = false;
  }
};

function isSelected(item) {
  return tableSelected.value.some((selected) => selected._id === item._id);
};

function isSelectable(item) {
  //load original submission object, as item may miss meta data if excludeMeta is true
  const submission = props.submissions.content.find((s) => s._id === item._id);
  return rightToManageSubmission(submission).allowed;
};

function toggleSelect(item) {
  if (isSelected(item)) {
    tableSelected.value = tableSelected.value.filter((selectedItem) => selectedItem._id !== item._id);
  } else {
    tableSelected.value.push(item);
  }
};

function toggleSelectAllItems() {
  if (props.selected.length > 0) {
    //de-select all
    tableSelected.value = [];
  } else {
    //select all
    tableSelected.value = selectableItems.value;
  }
};

watch([() => props.excludeMeta], createHeaders);
watch([() => props.submissions], fetchData);

fetchData();

</script>

<style scoped lang="scss">
.v-data-table :deep(td) {
  font-family: monospace;
  white-space: nowrap;
}
.v-data-table :deep(thead) > tr th {
  padding: 0 16px !important;
}

.v-data-table :deep(th) {
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

.v-data-table :deep(td.expand-cell) {
  vertical-align: top;
  padding-top: 8px;
  padding-bottom: 8px;
  height: 24px;
}

.v-data-table :deep(td.matrix-cell) {
  position: relative;
  height: 24px;
  line-height: 24px;
}

.v-data-table :deep(td.expand-cell) tr td.matrix-cell div::after {
  content: '';
  position: absolute;
  left: -16px;
  right: -16px;
  top: 0;
  height: 100%;
  border-top: thin solid rgba(0, 0, 0, 0.12);
}

.v-data-table :deep(td.expand-cell) tr:not(.last-row):last-child td.matrix-cell div::after {
  height: calc(100% + 1px);
  border-bottom: thin solid rgba(0, 0, 0, 0.12);
}
</style>