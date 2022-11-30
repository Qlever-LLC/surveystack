<template>
  <v-text-field
    v-if="header.type === 'text'"
    :value="value"
    @input="
      (v) => {
        value = getValueOrNull(v);
        onInput();
      }
    "
    outlined
    hide-details
    autocomplete="off"
    :disabled="disabled"
  />
  <div v-else-if="header.type === 'qrcode'" style="display: flex">
    <div style="flex: 1">
      <v-text-field
        ref="text-qrcode"
        :value="value"
        @input="
          (v) => {
            value = getValueOrNull(v);
            onInput();
          }
        "
        outlined
        hide-details
        autocomplete="off"
        :disabled="disabled"
      />
    </div>
    <div style="flex: 0; display: flex; align-items: center">
      <app-qr-scanner
        class="mx-2 py-2"
        ref="scan-button"
        small
        @codeDetected="
          (v) => {
            // console.log('value is', v);
            value = getValueOrNull(v);
            onInput();
          }
        "
      />
    </div>
  </div>

  <v-text-field
    v-else-if="header.type === 'farmos_uuid'"
    :value="localValue"
    @input="
      (v) => {
        if (!this.value || this.value.name !== v) {
          const text = getValueOrNull(v);
          value = {
            name: text,
            id: uuidv4(),
          };
        }
        onInput();
      }
    "
    outlined
    hide-details
    autocomplete="off"
    :disabled="disabled"
  />

  <v-text-field
    v-else-if="header.type === 'number'"
    :value="value"
    @input="
      (v) => {
        value = handleNumberInput(v);
        onInput();
      }
    "
    type="number"
    outlined
    hide-details
    :disabled="disabled"
  />
  <v-select
    v-else-if="header.type === 'dropdown'"
    :items="items"
    item-text="label"
    item-value="value"
    :value="value"
    @input="
      (v) => {
        value = getValueOrNull(v);
        onInput();
      }
    "
    hide-details
    outlined
    :multiple="header.multiple"
    :disabled="disabled"
  >
    <template v-slot:selection="{ item, index }">
      <matrix-cell-selection-label :label="item.label" :index="index" :value="value" />
    </template>
  </v-select>
  <v-autocomplete
    v-else-if="header.type === 'farmos_field'"
    :items="farmos.farms || []"
    :multiple="header.multiple"
    :value="value"
    @input="
      (v) => {
        value = getValueOrNull(v);
        onInput();
      }
    "
    :label="value ? value.farmName : null"
    item-text="value.name"
    item-value="value"
    hide-details
    clearable
    outlined
    :disabled="disabled || loading"
  >
    <template v-slot:selection="data" v-if="!!header.multiple">
      <v-chip v-bind="data.attrs" :input-value="data.selected" @click="data.select">
        <template v-slot:default>
          <span v-html="data.item.label" />
        </template>
      </v-chip>
    </template>
    <template v-slot:selection="{ item }" v-else>
      <div v-html="item.label" class="d-flex align-center autocomplete-selection"></div>
    </template>

    <template v-slot:item="data" v-if="!!header.multiple">
      <v-list-item-content>
        <v-list-item-title v-html="data.item.label" />
      </v-list-item-content>
    </template>
    <template v-slot:item="{ item }" v-else>
      <div v-html="item.label"></div>
    </template>
  </v-autocomplete>

  <v-autocomplete
    v-else-if="header.type === 'farmos_planting'"
    :multiple="header.multiple"
    :value="value"
    @input="
      (v) => {
        value = getValueOrNull(localChange(v));
        onInput();
      }
    "
    :items="farmos.plantings || []"
    :label="value ? value.farmName : null"
    item-text="value.name"
    item-value="value"
    hide-details
    outlined
    :disabled="disabled || loading"
  >
    <template v-slot:item="{ item }">
      <div v-html="item.label"></div>
    </template>
  </v-autocomplete>
  <div v-else-if="header.type === 'date'">
    <v-menu
      :close-on-content-click="false"
      v-model="menus[`${index}_${header.value}`]"
      transition="scale-transition"
      offset-y
      max-width="290px"
      min-width="290px"
      ref="datepickermenu"
      :disabled="disabled"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-text-field
          :value="value"
          @input="
            (v) => {
              value = v;
              onInput();
            }
          "
          @click="setActivePickerMonth"
          hide-details
          v-bind="attrs"
          v-on="on"
          outlined
          autocomplete="off"
          :disabled="disabled"
          :style="{ pointerEvents: disabled ? 'none' : 'auto' }"
          readonly
        ></v-text-field>
      </template>
      <v-date-picker
        :value="value"
        @input="
          (v) => {
            value = v;
            menus[`${index}_${header.value}`] = false;
            onInput();
          }
        "
        no-title
      ></v-date-picker>
    </v-menu>
  </div>

  <v-text-field v-else value="unknown cell type" outlined hide-details disabled />
</template>

<script>
import { getValueOrNull } from '@/utils/surveyStack';
import appQrScanner from '@/components/ui/QrScanner.vue';
import { uuidv4 } from '@/utils/surveys';
import MatrixCellSelectionLabel from './MatrixCellSelectionLabel.vue';

export default {
  components: {
    appQrScanner,
    MatrixCellSelectionLabel,
  },
  props: {
    header: {
      type: Object,
    },
    item: {
      type: Object,
    },
    index: {
      type: Number,
    },
    getDropdownItems: {
      type: Function,
    },
    farmos: {
      type: Object,
      default() {
        return { farms: [], plantings: [] };
      },
    },
    disabled: {
      type: Boolean,
    },
    loading: {
      type: Boolean,
    },
  },
  data() {
    return {
      menus: {}, // object to hold v-models for v-menu
      comboboxSearch: null,
    };
  },
  computed: {
    value: {
      get() {
        return this.item[this.header.value].value;
      },
      set(value) {
        this.item[this.header.value].value = value;
      },
    },
    localValue() {
      if (this.value == null) {
        return '';
      } else {
        return this.value && this.value.name ? this.value.name : '';
      }
    },
    items() {
      return this.getDropdownItems(this.header.value, Array.isArray(this.value) ? this.value : [this.value]);
    },
  },
  methods: {
    getValueOrNull,
    uuidv4,
    onInput() {
      this.$emit('changed');
    },
    handleNumberInput(v) {
      if (v === '') {
        return null;
      }

      const n = Number(v);

      // eslint-disable-next-line
      if (isNaN(n)) {
        return null;
      }

      return n;
    },
    getLabel(value) {
      const dropdownItems = this.items;
      const found = dropdownItems.find((i) => i.value === value);
      return found ? found.label : value;
    },
    setActivePickerMonth() {
      setTimeout(() => {
        this.$refs.datepickermenu.$children[1].$children[0].activePicker = 'MONTH';
      });
    },
    // copied/adapted from FarmOsPlanting.vue
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

      // console.log('hashes', hashes);

      const selectedItems = hashes.map((h) => {
        if (typeof h !== 'string') {
          return h;
        }
        return this.farmos.plantings.find((t) => t.value.hash === h).value;
      });

      // const [farmId, assetId] = itemId.split('.');

      const fields = selectedItems.filter((item) => !!item.isField);

      // selected assets
      const assets = selectedItems.filter((item) => !item.isField);

      const assetsToSelect = fields.flatMap((field) =>
        this.farmos.plantings
          .filter((item) => !item.value.isField)
          .filter((item) => item.value.farmId === field.farmId)
          .filter((item) => item.value.location.some((loc) => loc.id === field.location.id))
      );

      assetsToSelect.forEach((assetToSelect) => {
        if (
          assets.some(
            (asset) => asset.farmId === assetToSelect.value.farmId && asset.assetId === assetToSelect.value.assetId
          )
        ) {
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
};
</script>

<style scoped>
>>> .v-select__selections {
  flex-wrap: nowrap;
}
>>> .v-select__selections span {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

>>> .blue-chip,
>>> .orange-chip,
>>> .green-chip {
  display: inline-flex;
  border: 1px var(--v-focus-base) solid;
  color: var(--v-focus-base);
  border-radius: 0.6rem;
  font-weight: bold;
  font-size: 80%;
  padding: 0.2rem;
  padding-left: 0.4rem;
  padding-right: 0.2rem;
  vertical-align: middle;
  margin-top: 0.4rem;
  margin-bottom: 0.4rem;
  margin-right: 0.2rem !important;
}

>>> .green-chip {
  color: #46b355;
  border: 1px #46b355 solid;
}

div >>> .orange-chip {
  color: #f38d49;
  border: 1px #f38d49 solid;
}

>>> .v-list-item.v-list-item--active {
  color: var(--v-focus-base) !important;
}
</style>
