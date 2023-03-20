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
      :maxWidth="400"
    >
      Do you want to delete this row?
    </app-dialog>

    <v-dialog
      v-model="showEditItemDialog"
      v-bind="dialogProps"
      v-if="showEditItemDialog"
      title="Edit"
      hideCancel
      @confirm="showEditItemDialog = false"
      max-width="800px"
    >
      <div style="background: #1867c0; padding: 4px 0px">
        <v-card>
          <v-card-title>
            <v-btn @click="duplicateRow(editedIndex)" text color="primary">
              <v-icon left>mdi-content-copy</v-icon>Duplicate
            </v-btn>
            <v-spacer />
            <v-btn text @click="showEditItemDialog = false"> Close <v-icon right>mdi-close</v-icon> </v-btn>
          </v-card-title>
          <v-card-text>
            <v-form autocomplete="off" @submit.prevent="">
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
                  class="my-2"
                />
              </div>
            </v-form>
          </v-card-text>
          <v-card-actions class="d-flex justify-space-between">
            <v-btn text @click="rowToBeDeleted = editedIndex" class="ma-2" color="error">
              <v-icon left>mdi-trash-can-outline</v-icon>Delete
            </v-btn>
            <v-btn text @click="showEditItemDialog = false" class="ma-2">
              Close <v-icon right>mdi-close</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>
    </v-dialog>

    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <app-control-hint :value="control.hint" />

    <app-matrix-table
      :headers="headers"
      :rows="rows || []"
      :fixedColumns="fixedColumns"
      :isMobile="isMobile"
      :rowActionsWidth="64"
      :floatingFooterSize="isInBuilder ? 0 : 64"
      :addRowLabel="addRowLabel"
      @showEditDialog="(rowIdx) => editItem(rowIdx)"
      @addRow="add"
    >
      <template v-slot:header-cell="{ header }">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <span class="flex-grow-1 text-truncate" v-on="on">{{ header.label }}</span>
          </template>
          <span>{{ header.type }}: {{ header.label }}</span>
        </v-tooltip>
        <app-redacted v-if="header.redacted" />
        <app-required v-if="header.required" />
      </template>
      <template v-slot:row-cell="{ header, row, colIdx }">
        <v-form autocomplete="off" @submit.prevent="" :style="{ width: '100%' }">
          <app-matrix-cell
            :header="header"
            :item="row"
            :getDropdownItems="getDropdownItems"
            :farmos="farmos"
            :index="colIdx"
            @changed="onInput"
            :disabled="isMobile"
            class="mt-2"
            :loading="loading"
          />
        </v-form>
      </template>
      <template v-if="!isMobile" v-slot:row-actions="{ rowIdx }">
        <div style="width: 64px; padding-left: 4px !important; padding-right: 0px">
          <div class="d-flex">
            <v-btn icon @click="rowToBeDeleted = rowIdx" tabindex="-1" small>
              <v-icon>mdi-trash-can-outline</v-icon>
            </v-btn>
            <v-btn icon @click="duplicateRow(rowIdx)" tabindex="-1" small>
              <v-icon>mdi-content-copy</v-icon>
            </v-btn>
          </div>
        </div>
      </template>
    </app-matrix-table>
    <app-control-more-info :value="control.moreInfo" />

    <div class="d-flex flex-row align-center" v-if="loading">
      <v-progress-circular indeterminate color="primary" size="24" />
      <div class="ml-2 text--secondary">Loading farmOS data</div>
    </div>
  </div>
</template>

<script>
import { cloneDeep, isNil, sortBy, uniq, without } from 'lodash';
import appDialog from '@/components/ui/Dialog.vue';
import appMatrixCell from '@/components/survey/question_types/matrix/MatrixCell.vue';
import appMatrixTable from '@/components/survey/question_types/matrix/MatrixTable.vue';
import appRequired from '@/components/survey/drafts/Required.vue';
import appRedacted from '@/components/survey/drafts/Redacted.vue';
import baseQuestionComponent from '../BaseQuestionComponent';
import farmosBase from '../FarmOsBase';
import { cleanupAutocompleteMatrix } from '@/utils/surveys';

/* copied from FarmOsPlanting.vue */
const hashItem = (listItem) => {
  if (listItem === null || listItem.value === null) {
    return '';
  }

  const { value } = listItem;
  if (value.isField) {
    if (!value.farmId) {
      return 'NOT_ASSIGNED';
    }
    return `FIELD:${value.farmId}.${value.location.id}`;
  }

  return `ASSET:${value.farmId}.${value.assetId}`;
};

/* copied from FarmOsPlanting.vue */
const transform = (assets) => {
  const withoutArea = [];
  const localAssets = [];
  const areas = {};

  assets.forEach((asset) => {
    if (asset.value.location.length === 0) {
      const tmp = Object.assign({}, asset);
      tmp.value.hash = hashItem(asset);
      if (asset.value.url === '') {
        localAssets.push(tmp);
      } else {
        withoutArea.push(tmp);
      }
      return;
    }

    asset.value.location.forEach((location) => {
      areas[`${asset.value.farmId}.${location.id}`] = {
        farmId: asset.value.farmId,
        farmName: asset.value.farmName,
        location,
      };
    });
  });

  const res = Object.keys(areas).flatMap((key) => {
    const area = areas[key];

    const matchedAssets = assets.filter((asset) => {
      if (asset.value.farmId !== area.farmId) {
        return false;
      }

      return asset.value.location.some((loc) => loc.id === area.location.id);
    });

    const field = {
      value: {
        farmId: area.farmId,
        farmName: area.farmName,
        location: area.location,
        isField: true,
      },
      label: `<span class="blue-chip mr-4 ml-0 chip-no-wrap">${area.farmName}: ${area.location.name}</span>`,
    };

    field.value.hash = hashItem(field);

    const assetItems = matchedAssets.map((asset) => {
      const r = {
        value: asset.value,
        label: `${asset.value.name} `,
      };

      r.value.hash = hashItem(r);
      return r;
    });

    return [field, ...assetItems];
  });

  const withoutAreaSection = {
    value: {
      farmId: null,
      farmName: null,
      location: null,
      isField: true,
    },
    label: '<span class="blue-chip mr-4 ml-0 chip-no-wrap">Plantings without Area</span>',
  };

  const localAssetSection = {
    value: {
      farmId: null,
      farmName: null,
      location: null,
      isField: true,
    },
    label: '<span class="green-chip mr-4 ml-0 chip-no-wrap">New Plantings</span>',
  };

  res.push(withoutAreaSection, ...withoutArea);

  if (localAssets.length > 0) {
    res.unshift(localAssetSection, ...localAssets);
  }

  return res;
};

export default {
  mixins: [baseQuestionComponent, farmosBase('fields')],
  components: {
    appDialog,
    appMatrixCell,
    appMatrixTable,
    appRequired,
    appRedacted,
  },
  computed: {
    source() {
      return this.control.options.source;
    },
    headers() {
      return (
        this.source.content
          // remove all hidden headers
          .filter((header) => !header.hidden)
          // Compatible with original `autocomplete` question type (https://gitlab.com/OpenTEAM1/draft-tech-feedback/-/issues/56)
          .map(cleanupAutocompleteMatrix)
      );
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
      return !this.$vuetify.breakpoint.smAndUp || this.forceMobile;
    },
    farmos() {
      return { farms: this.farms, plantings: this.farmosTransformedPlantings };
    },
  },
  data() {
    return {
      rows: this.value,
      rowToBeDeleted: -1,
      menus: {}, // object to hold v-models for v-menu
      farmosTransformedPlantings: [],
      showEditItemDialog: false,
      editedIndex: -1,
      editedItem: null,
    };
  },
  methods: {
    add() {
      // create empty row object from headers
      const newRow = this.fields.reduce((prev, current) => ({ ...prev, [current]: { value: null } }), {});
      for (const key of Object.keys(newRow)) {
        const header = this.headers.find((h) => h.value === key);
        if (!header) {
          continue;
        }
        if (header.redacted) {
          newRow[key].meta = { permissions: ['admin'] };
        }
        newRow[key].value = header.defaultValue || null;
      }
      if (this.rows === null) {
        this.rows = [];
      }
      this.rows.push(newRow);
      this.$emit('changed', this.rows);
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
      this.$emit('changed', this.rows);
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
      this.$emit('changed', this.rows);
    },
    duplicateRow(idx) {
      this.showEditItemDialog = false;
      const clone = cloneDeep(this.rows[idx]);
      this.rows = [...this.rows, clone];
      this.$emit('changed', this.rows);
    },
  },
  async created() {
    //load farmos field areas
    if (this.headers.find((header) => header.type === 'farmos_field')) {
      this.fetchAreas();
    }
    // load farmos assets
    if (this.headers.find((header) => header.type === 'farmos_planting')) {
      await this.fetchAssets();
      this.farmosTransformedPlantings = transform(this.assets);
    }
  },
};
</script>

<style scoped>
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

>>> .v-data-table__wrapper::-webkit-scrollbar {
  height: 12px;
}

>>> .v-data-table__wrapper::-webkit-scrollbar-track {
  border-radius: 3px;
  background: #eee;
}

>>> .v-data-table__wrapper::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: #bbb;
}
</style>
