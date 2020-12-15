<template>
  <div>
    <app-dialog
      v-model="showConfirmDeletionDialog"
      v-if="rowToBeDeleted >= 0"
      @confirm="remove(rowToBeDeleted)"
      @cancel="rowToBeDeleted = -1"
      title="Confirm Row Deletion"
      labelConfirm="DELETE"
    >
      <pre>{{rows[rowToBeDeleted]}}</pre>
    </app-dialog>

    <h2 v-if="control.title">{{control.title}}</h2>
    <h3
      v-if="control.label"
      class="text--secondary"
    >{{control.label}}</h3>
    <v-data-table
      :headers="headers"
      :hide-default-footer="true"
      :items="rows"
      disable-sort
      mobile-breakpoint="0"
    >
      <template v-slot:body="{ items, headers }">
        <tbody>
          <tr
            v-for="(item,idx) in items"
            :key="idx"
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
                <v-text-field
                  v-if="header.type === 'text'"
                  :label="header.value"
                  :value="item[header.value]"
                  @input="v => {item[header.value] = v; onInput()}"
                  solo
                  hide-details
                  class="matrix-cell my-2"
                  autocomplete="off"
                />
                <v-text-field
                  v-else-if="header.type === 'number'"
                  :label="header.value"
                  :value="item[header.value]"
                  @input="v => {item[header.value] = Number(v); onInput()}"
                  type="number"
                  solo
                  hide-details
                  class="matrix-cell my-2"
                />
                <v-select
                  v-else-if="header.type === 'dropdown'"
                  :items="getDropdownItems(header.value)"
                  :value="item[header.value]"
                  @input="v => {item[header.value] = v; onInput()}"
                  hide-details
                  solo
                  class="matrix-cell my-2"
                  :multiple="header.multiple"
                />
                <v-autocomplete
                  v-else-if="header.type === 'autocomplete'"
                  :items="getDropdownItems(header.value)"
                  :value="item[header.value]"
                  @input="v => {item[header.value] = v; onInput()}"
                  hide-details
                  solo
                  :multiple="header.multiple"
                />
                <v-autocomplete
                  v-else-if="header.type === 'farmos_field'"
                  :label="header.value"
                  :items="farms || []"
                  :value="item[header.value]"
                  @input="v => {item[header.value] = v; onInput()}"
                  item-text="label"
                  item-value="value"
                  hide-details
                  solo
                  :disabled="loading"
                >
                  <template v-slot:item="{item}">
                    <div v-html="item.label"></div>
                  </template>
                  <template v-slot:selection="{item}">
                    <div
                      v-html="item.label"
                      class="d-flex align-center"
                    ></div>
                  </template>
                </v-autocomplete>
                <v-autocomplete
                  v-else-if="header.type === 'farmos_planting'"
                  :label="header.value"
                  :value="item[header.value]"
                  @input="v => {item[header.value] = localChange(v); onInput()}"
                  :items="farmosTransformedPlantings || []"
                  item-text="label"
                  item-value="value"
                  hide-details
                  solo
                  :disabled="loading"
                >
                  <template v-slot:item="{item}">
                    <div v-html="item.label"></div>
                  </template>
                  <template v-slot:selection="{item}">
                    <div
                      v-html="item.label"
                      class="d-flex align-center"
                    ></div>
                  </template>
                </v-autocomplete>
                <div v-else-if="header.type === 'date'">
                  <v-menu
                    :close-on-content-click="false"
                    v-model="menus[`${idx}_${header.value}`]"
                    transition="scale-transition"
                    offset-y
                    max-width="290px"
                    min-width="290px"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        :value="item[header.value]"
                        @input="v => {item[header.value] = v; onInput()}"
                        label="Date"
                        hide-details
                        v-bind="attrs"
                        v-on="on"
                        solo
                        autocomplete="off"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      :value="item[header.value]"
                      @input="v => {item[header.value] = v; menus[`${idx}_${header.value}`] = false; onInput()}"
                      no-title
                    ></v-date-picker>
                  </v-menu>
                </div>

                <div v-else>
                  ???
                </div>
              </v-form>
            </td>
            <td style="width: 64px; padding-left: 4px !important; padding-right: 0px;">
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
    <div
      v-if="control.hint"
      class="my-3 text--secondary"
    >{{control.hint}}</div>
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
  },
  computed: {
    source() {
      return this.control.options.source;
    },
    headers() {
      const headers = this.source.content.map(col => ({
        text: col.label, value: col.value, type: col.type, multiple: col.multiple,
      }));

      return headers;
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
  },
  data() {
    return {
      rows: this.value || [],
      rowToBeDeleted: -1,
      menus: {}, // object to hold v-models for v-menu
      farmosTransformedPlantings: [],
    };
  },
  methods: {
    add() {
      // create empty row object from headers
      const newRow = this.fields.reduce((accu, current) => ({ ...accu, [current]: null }), {});
      this.rows.push(newRow);
    },
    remove(row) {
      this.rows.splice(row, 1);
      this.rowToBeDeleted = -1;
      this.$emit('changed', this.rows);
    },
    getDropdownItems(field) {
      const column = this.source.content.find(col => col.value === field);
      const ontology = this.resources.find(resource => resource.id === column.resource);
      return ontology.content.map(row => ({ text: row.label, value: row.value }));
    },
    onInput() {
      this.$emit('changed', this.rows);
    },
    duplicateRow(idx) {
      const clone = cloneDeep(this.rows[idx]);
      this.rows = [...this.rows, clone];
      this.$emit('changed', this.rows);
    },
    // copied from FarmOsPlanting.vue
    localChange(hashesArg) {
      let hashes;
      if (!Array.isArray(hashesArg)) {
        if (hashesArg) {
          hashes = [hashesArg];
        } else {
          return null;
        }
      } else {
        hashes = hashesArg;
      }

      console.log('hashes', hashes);


      const selectedItems = hashes.map((h) => {
        if (typeof h !== 'string') {
          return h;
        }
        return (this.transformed.find(t => t.value.hash === h)).value;
      });


      // const [farmId, assetId] = itemId.split('.');

      const fields = selectedItems.filter(item => !!item.isField);

      // selected assets
      const assets = selectedItems.filter(item => !item.isField);

      const assetsToSelect = fields.flatMap(field => this.transformed
        .filter(item => !item.value.isField)
        .filter(item => item.value.farmId === field.farmId)
        .filter(item => item.value.location.some(loc => loc.id === field.location.id)));


      assetsToSelect.forEach((assetToSelect) => {
        if (assets.some(asset => asset.farmId === assetToSelect.value.farmId
          && asset.assetId === assetToSelect.value.assetId)) {
          // skip
        } else {
          assets.push(assetToSelect.value);
        }
      });


      if (!Array.isArray(hashesArg)) {
        return assets[0];
      }

      return assets;
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
  min-width: 5rem;
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
