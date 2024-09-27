<template>
  <div>
    <app-dialog
      v-model="showConfirmDeletionDialog"
      v-bind="dialogProps"
      v-if="rowToBeDeleted >= 0"
      @confirm="remove(rowToBeDeleted)"
      @cancel="rowToBeDeleted = -1"
      title="Confirm Deletion"
      labelConfirm="DELETE"
      :maxWidth="400">
      Do you want to delete this row?
    </app-dialog>

    <app-dialog
      v-model="showConfirmInitializeDialog"
      v-bind="dialogProps"
      @confirm="
        showConfirmInitializeDialog = false;
        initialize();
      "
      @cancel="showConfirmInitializeDialog = false"
      title="Confirm Reset"
      labelConfirm="RESET"
      :maxWidth="400">
      Do you want to reset this spreadsheet based on the previous answers in your survey? You will have to re-enter any
      custom information you have entered.
    </app-dialog>

    <a-dialog v-model="showEditItemDialog" v-bind="dialogProps" v-if="showEditItemDialog" max-width="800px">
      <a-card>
        <a-card-title class="d-flex justify-space-between">
          <a-btn @click="duplicateRow(editedIndex)" variant="text" color="primary">
            <a-icon left>mdi-content-copy</a-icon>Duplicate
          </a-btn>
          <a-btn variant="text" @click="showEditItemDialog = false"> Close <a-icon right>mdi-close</a-icon> </a-btn>
        </a-card-title>
        <a-card-text style="padding: 0px 12px">
          <a-form autocomplete="off" @submit.prevent="">
            <div v-for="(header, idx) in headers" :key="header.value">
              <div class="d-flex align-center">
                <h4>{{ header.label }}</h4>
                <app-redacted v-if="header.redacted" />
                <app-required v-if="header.required" />
              </div>
              <app-matrix-cell
                :header="header"
                :item="editedItem"
                :getDropdownItems="getDropdownItems"
                :farmos="farmos"
                :index="idx"
                @changed="onInput"
                class="my-2" />
            </div>
          </a-form>
        </a-card-text>
        <a-card-actions class="d-flex justify-space-between">
          <a-btn variant="text" @click="rowToBeDeleted = editedIndex" class="ma-2" color="error" dense>
            <a-icon left>mdi-trash-can-outline</a-icon>
          </a-btn>
          <a-btn variant="text" @click="showEditItemDialog = false" class="ma-2" dense>
            Close <a-icon right>mdi-close</a-icon>
          </a-btn>
        </a-card-actions>
      </a-card>
    </a-dialog>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      :is-modified="meta && !!meta.dateModified"
      initializeTooltip="Reset rows"
      @initialize="initializeConfirm" />
    <app-control-hint :value="control.hint" />

    <app-matrix-table
      :headers="headers"
      :fakeRow="generateFakeRow()"
      :rows="rows || []"
      :fixedColumns="fixedColumns"
      :isMobile="isMobile"
      :rowActionsWidth="64"
      :floatingFooterSize="isInBuilder ? 0 : 64"
      :addRowLabel="addRowLabel"
      @showEditDialog="(rowIdx) => editItem(rowIdx)"
      @addRow="add">
      <template v-slot:header-cell="{ header }">
        <span
          class="flex-grow-1 text-truncate-two-lines icon-on-hover"
          style="cursor: pointer"
          @click="sortRows(header)">
          {{ header.label }}
          <a-icon
            :class="sortedHeader === header?.value ? '' : 'sort-icon'"
            :color="sortedHeader === header?.value ? 'primary' : ''"
            :icon="sortAsc ? 'mdi-menu-up' : 'mdi-menu-down'"
            large
            @click.stop="sortRows(header)" />
          <a-tooltip top activator="parent">{{ header.type }}: {{ header.label }}</a-tooltip>
        </span>
        <app-redacted v-if="header.redacted" />
        <app-required v-if="header.required" />
      </template>
      <template v-slot:row-cell="{ header, row, colIdx }">
        <a-form autocomplete="off" @submit.prevent="" :style="{ width: '100%' }">
          <app-matrix-cell
            :header="header"
            :item="row"
            :getDropdownItems="getDropdownItems"
            :farmos="farmos"
            :index="colIdx"
            @changed="onInput"
            :disabled="isMobile"
            class="mt-2"
            :loading="isFarmOsLoading" />
        </a-form>
      </template>
      <template v-if="!isMobile" v-slot:rowActions="{ rowIdx }">
        <div class="d-flex flex-grow-1" style="padding-left: 4px !important; padding-right: 0px">
          <a-btn icon @click="rowToBeDeleted = rowIdx" tabindex="-1" dense>
            <a-icon>mdi-trash-can-outline</a-icon>
          </a-btn>
          <a-btn icon @click="duplicateRow(rowIdx)" tabindex="-1" dense>
            <a-icon>mdi-content-copy</a-icon>
          </a-btn>
        </div>
      </template>
    </app-matrix-table>
    <app-control-more-info :value="control.moreInfo" />

    <div class="d-flex flex-row align-center" v-if="isFarmOsLoading">
      <a-progress-circular size="24" />
      <div class="ml-2 text-secondary">Loading farmOS data</div>
    </div>
  </div>
</template>

<script>
import { cloneDeep, isNil, uniq, without } from 'lodash';
import appDialog from '@/components/ui/Dialog.vue';
import appMatrixCell from '@/components/survey/question_types/matrix/MatrixCell.vue';
import appMatrixTable from '@/components/survey/question_types/matrix/MatrixTable.vue';
import appRequired from '@/components/survey/drafts/Required.vue';
import appRedacted from '@/components/survey/drafts/Redacted.vue';
import baseQuestionComponent from '../BaseQuestionComponent';
import farmosBase from '../FarmOsBase';
import { createRow } from './matrixUtils';

export default {
  mixins: [baseQuestionComponent, farmosBase],
  components: {
    appDialog,
    appMatrixCell,
    appMatrixTable,
    appRequired,
    appRedacted,
  },
  data() {
    return {
      rows: this.modelValue,
      sortedHeader: null,
      sortAsc: null,
      rowToBeDeleted: -1,
      menus: {}, // object to hold v-models for v-menu
      farmosTransformedPlantings: [],
      showEditItemDialog: false,
      editedIndex: -1,
      editedItem: null,
      isFarmOsLoading: false,
      showConfirmInitializeDialog: false,
    };
  },
  computed: {
    source() {
      return this.control.options.source;
    },
    headers() {
      // remove all hidden headers
      return this.source.content.filter((header) => !header.hidden);
    },
    fields() {
      return this.source.content.map((col) => col.value);
    },
    addRowLabel() {
      return this.source.config.addRowLabel;
    },
    fixedColumns() {
      return this.source.config.fixedColumns;
    },
    showConfirmDeletionDialog: {
      get() {
        return this.rowToBeDeleted >= 0;
      },
      set() {
        this.rowToBeDeleted = -1;
      },
    },
    isMobile() {
      return !this.$vuetify.display.smAndUp || this.forceMobile;
    },
    farmos() {
      return { farms: this.farms, plantings: this.farmosTransformedPlantings };
    },
  },
  methods: {
    generateFakeRow() {
      const createdFakeRow = createRow(this.fields, this.headers);
      return [createdFakeRow];
    },
    add() {
      const newRow = createRow(this.fields, this.headers);
      if (this.rows === null) {
        this.rows = [];
      }
      this.rows.push(newRow);
      this.changed(this.rows);
      if (this.isMobile) {
        this.editItem(this.rows.length - 1);
      }
    },
    remove(row) {
      this.showEditItemDialog = false;
      this.rows.splice(row, 1);
      this.rowToBeDeleted = -1;
      if (this.rows.length === 0) {
        this.rows = null;
      }
      this.changed(this.rows);
    },
    editItem(index) {
      this.editedIndex = index;
      this.editedItem = this.rows[index];
      this.showEditItemDialog = true;
    },
    getDropdownItems(field, values = []) {
      const column = this.source.content.find((col) => col.value === field);
      const ontology = this.resources.find((resource) => resource.id === column.resource);
      if (!ontology) {
        return [];
      }
      const defaultItems = ontology.content.map((row) => ({ label: row.label, value: row.value }));
      const usedValues = this.rows
        .map((row) => row[field].value) // get the value from each row
        .map((value) => (Array.isArray(value) ? value : [value])) // convert individual values to list
        .flat(); // convert the values of each row into one list
      // All the custom items the users typed in
      const customItems = without(
        uniq(usedValues).filter((v) => !isNil(v)), // get all the uniq non-empty values
        ...defaultItems.map((i) => i.value) // without the default values
      ).map((value) => ({ label: value, value }));

      return [...defaultItems, ...customItems];
    },
    onInput() {
      this.changed(this.rows);
    },
    duplicateRow(idx) {
      this.showEditItemDialog = false;
      const clone = cloneDeep(this.rows[idx]);
      this.rows = [...this.rows, clone];
      this.changed(this.rows);
    },
    sortRows(header) {
      if (this.sortedHeader && this.sortedHeader !== header.value) {
        //selected header changed, reset sort direction
        this.sortAsc = null;
      }
      if (!this.sortAsc) {
        //if sortAsc is null or false, switch it to true
        this.sortAsc = true;
      } else {
        //switch to desc order
        this.sortAsc = false;
      }

      this.sortedHeader = header.value;

      this.rows?.sort((a, b) => {
        let result = 0;

        let valueA = a[header.value].value;
        let valueB = b[header.value].value;

        //reduce arrays to the first element for sorting
        if (Array.isArray(valueA)) {
          valueA = valueA?.[0] || undefined;
        }
        if (Array.isArray(valueB)) {
          valueB = valueB?.[0] || undefined;
        }

        if (typeof valueA === 'number' && typeof valueB === 'number') {
          // Numerical comparison
          result = valueA - valueB;
        } else if (typeof valueA === 'object' && valueA.name && typeof valueB === 'object' && valueB.name) {
          //this works in case of farmos fields and plantings. Don't check for the header type to decouple this function from question types
          result = String(valueA.name).toLowerCase().localeCompare(String(valueB.name).toLowerCase());
        } else {
          // Case-insensitive lexicographical comparison (for strings and dates treated as strings)
          result = String(valueA).toLowerCase().localeCompare(String(valueB).toLowerCase());
        }
        if (!this.sortAsc) {
          result = -result;
        }
        return result;
      });
      this.changed(this.rows);
    },
    initializeConfirm() {
      if (this.meta && !!this.meta.dateModified) {
        this.showConfirmInitializeDialog = true;
      } else {
        this.initialize();
      }
    },
  },
  async created() {
    this.isFarmOsLoading = true;

    //load farmos field areas
    if (this.headers.some((header) => header.type === 'farmos_field')) {
      await this.fetchAreas();
    }

    // load farmos assets
    if (this.headers.some((header) => header.type === 'farmos_planting')) {
      await this.fetchAssets();
      this.farmosTransformedPlantings = this.transform(this.assets);
    }

    this.isFarmOsLoading = false;
  },
  watch: {
    modelValue() {
      //TODO CHECK
      this.rows = this.modelValue || [];
    },
  },
};
</script>

<style scoped lang="scss">
/*
  'scrollbar-color' and 'scrollbar-width' should be working on Firefox Android since version 64
  https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Scrollbars#Browser_compatibility
  It works with Firefox on Desktop, but apparently it does not work on Firefox Android version 84
*/
/*
>>> .v-data-table__wrapper {
  scrollbar-color: red blue !important;
  scrollbar-width: auto;
}
*/

// :deep(.v-data-table__wrapper::-webkit-scrollbar) {
//   height: 12px;
// }

// :deep(.v-data-table__wrapper::-webkit-scrollbar-track) {
//   border-radius: 3px;
//   background: #eee;
// }

// :deep(.v-data-table__wrapper::-webkit-scrollbar-thumb) {
//   border-radius: 3px;
//   background: #bbb;
// }

.chip-no-wrap {
  white-space: nowrap;
}

:deep(.blue-chip, .orange-chip, .green-chip) {
  display: inline-flex;
  border: 1px rgb(var(--v-theme-focus)) solid;
  background-color: white;
  color: rgb(var(--v-theme-focus));
  border-radius: 0.4rem;
  font-weight: bold;
  font-size: 80%;
  padding: 0.2rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
  vertical-align: middle;
}

:deep(.green-chip) {
  color: #46b355;
  border: 1px #46b355 solid;
}

:deep(.orange-chip) {
  color: #f38d49;
  border: 1px #f38d49 solid;
}

.text-truncate-two-lines {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.sort-icon {
  display: none;
}

.icon-on-hover:hover .sort-icon {
  display: inline;
}
</style>
