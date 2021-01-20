<template>
  <div>
    <app-dialog
      v-model="showConfirmDeletionDialog"
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
      v-if="showEditItemDialog"
      title="Edit"
      hideCancel
      @confirm="showEditItemDialog = false"
    >
      <div style="background: #1867c0; padding: 4px 0px">
        <v-card>
          <v-card-title>
            <v-btn
              @click="duplicateRow(editedIndex)"
              text
              color="primary"
            >
              <v-icon left>mdi-content-copy</v-icon>Duplicate
            </v-btn>
            <v-spacer />
            <v-btn
              text
              @click="showEditItemDialog = false"
            >
              Close <v-icon right>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-form
              autocomplete="off"
              @submit.prevent=""
            >
              <div
                v-for="(header, idx) in headers"
                :key="header.value"
              >
                <div class="d-flex align-center">
                  <h4>{{header.label}}</h4>
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
                  class="matrix-cell my-2"
                />
              </div>
            </v-form>
          </v-card-text>
          <v-card-actions class="d-flex justify-space-between">
            <v-btn
              text
              @click="rowToBeDeleted = editedIndex"
              class="ma-2"
              color="error"
            >
              <v-icon left>mdi-trash-can-outline</v-icon>Delete
            </v-btn>
            <v-btn
              text
              @click="showEditItemDialog = false"
              class="ma-2"
            >
              Close <v-icon right>mdi-close</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>
    </v-dialog>

    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
    />
    <app-control-hint :value="control.hint" />

    <v-data-table
      :headers="headers"
      header
      disable-pagination
      hide-default-footer
      hide-default-header
      :items="rows"
      disable-sort
      mobile-breakpoint="0"
    >
      <template v-slot:header="{props: {headers}}">
        <thead>
          <tr>
            <th
              v-for="h in headers"
              :key="h.value"
            >
              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <span v-on="on">{{h.label}}</span>
                </template>
                <span>{{h.type}}</span>
              </v-tooltip>
              <app-redacted v-if="h.redacted" />
              <app-required v-if="h.required" />
            </th>
          </tr>
        </thead>
      </template>
      <template v-slot:body="{ items, headers }">
        <tbody>
          <tr
            v-for="(item,idx) in items"
            :key="idx"
            @click="isMobile ? editItem(idx) : () => {}"
          >
            <td
              v-for="(header,key) in headers"
              :key="key"
              class="py-0 px-1"
            >
              <v-form
                autocomplete="off"
                @submit.prevent=""
              >
                <app-matrix-cell
                  :header="header"
                  :item="item"
                  :getDropdownItems="getDropdownItems"
                  :farmos="farmos"
                  :index="idx"
                  @changed="onInput"
                  :disabled="isMobile"
                  class="matrix-cell my-2"
                  :style="{minWidth: header.scaleWidth ? `calc(10rem * ${header.scaleWidth}/100)` : '10rem'}"
                />
              </v-form>
            </td>
            <td
              v-if="!isMobile"
              style="width: 64px; padding-left: 4px !important; padding-right: 0px;"
            >
              <div class="d-flex">
                <v-btn
                  icon
                  @click="rowToBeDeleted = idx"
                  tabindex="-1"
                  small
                >
                  <v-icon>mdi-trash-can-outline</v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="duplicateRow(idx)"
                  tabindex="-1"
                  small
                >
                  <v-icon>mdi-content-copy</v-icon>
                </v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </template>
    </v-data-table>
    <div class="mt-4 mb-12">
      <v-btn
        @click="add"
        color="primary"
      >
        <v-icon left>mdi-plus</v-icon>{{addRowLabel}}
      </v-btn>
    </div>
    <app-control-more-info :value="control.moreInfo" />

    <div
      class="d-flex flex-row align-center"
      v-if="loading"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="24"
      />
      <div class="ml-2 text--secondary">Loading farmOS data</div>
    </div>

  </div>
</template>

<script>
import { cloneDeep } from 'lodash';
import appDialog from '@/components/ui/Dialog.vue';
import appMatrixCell from '@/components/survey/question_types/MatrixCell.vue';
import appRequired from '@/components/survey/drafts/Required.vue';
import appRedacted from '@/components/survey/drafts/Redacted.vue';


import baseQuestionComponent from './BaseQuestionComponent';
import farmosBase from './FarmOsBase';

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
  console.log('transformassets', assets);

  const withoutArea = [];
  const areas = {};

  assets.forEach((asset) => {
    if (asset.value.location.length === 0) {
      const tmp = Object.assign({}, asset);
      tmp.value.hash = hashItem(asset);
      withoutArea.push(tmp);
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

      return asset.value.location.some(loc => loc.id === area.location.id);
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

  res.push(withoutAreaSection, ...withoutArea);
  console.log('res', res);

  return res;
};


export default {
  mixins: [baseQuestionComponent, farmosBase('fields')],
  components: {
    appDialog,
    appMatrixCell,
    appRequired,
    appRedacted,
  },
  computed: {
    source() {
      return this.control.options.source;
    },
    headers() {
      return this.source.content;
    },
    fields() {
      return this.source.content.map(col => col.value);
    },
    addRowLabel() {
      return this.source.config.addRowLabel;
    },
    showConfirmDeletionDialog: {
      get() {
        return this.rowToBeDeleted >= 0;
      },
      set(v) {
        // set from dialog close
        this.rowToBeDeleted = -1;
      },
    },
    isMobile() {
      return !this.$vuetify.breakpoint.smAndUp;
    },
    farmos() {
      return { farms: this.farms, plantings: this.farmosTransformedPlantings };
    },
  },
  data() {
    return {
      rows: this.value || [],
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
      const newRow = this.fields.reduce((accu, current) => ({ ...accu, [current]: { value: null } }), {});

      // eslint-disable-next-line
      for (const key of Object.keys(newRow)) {
        const header = this.headers.find(h => h.value === key);

        if (header && header.redacted) {
          newRow[key].meta = { permissions: ['admin'] };
        }
      }

      this.rows.push(newRow);
      if (this.isMobile) {
        this.editItem(this.rows.length - 1);
      }
    },
    remove(row) {
      this.showEditItemDialog = false;
      this.rows.splice(row, 1);
      this.rowToBeDeleted = -1;
      this.$emit('changed', this.rows);
    },
    editItem(index) {
      this.editedIndex = index;
      this.editedItem = this.rows[index];
      this.showEditItemDialog = true;
    },
    getDropdownItems(field) {
      const column = this.source.content.find(col => col.value === field);
      const ontology = this.resources.find(resource => resource.id === column.resource);
      return ontology.content.map(row => ({ label: row.label, value: row.value }));
    },
    onInput() {
      console.log('onInput', this.rows);
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
    if (this.headers.find(header => header.type === 'farmos_field')) {
      this.fetchAreas();
    }

    if (this.headers.find(header => header.type === 'farmos_planting')) {
      await this.fetchAssets();
      this.farmosTransformedPlantings = transform(this.assets);
    }
  },
};
</script>

<style scoped>
.matrix-cell {
  /*min-width: 11rem;*/
}

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
