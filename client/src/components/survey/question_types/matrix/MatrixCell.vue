<template>
  <a-text-field
    v-if="header.type === 'text'"
    :value="value"
    @input="onInput"
    outlined
    hide-details
    autocomplete="off"
    :disabled="disabled"
  />
  <div v-else-if="header.type === 'qrcode'" style="display: flex">
    <div style="flex: 1">
      <a-text-field
        ref="text-qrcode"
        :value="value"
        @input="onInput"
        outlined
        hide-details
        autocomplete="off"
        :disabled="disabled"
      />
    </div>
    <div style="flex: 0; display: flex; align-items: center">
      <app-qr-scanner class="mx-2 py-2" ref="scan-button" small @codeDetected="onInput" />
    </div>
  </div>
  <a-text-field
    v-else-if="header.type === 'farmos_uuid'"
    :value="localValue"
    @input="onFarmOsInput"
    outlined
    hide-details
    autocomplete="off"
    :disabled="disabled"
  />
  <a-text-field
    v-else-if="header.type === 'number'"
    :value="value"
    @input="onNumberInput"
    type="number"
    outlined
    hide-details="auto"
    :disabled="disabled"
    :rules="[isValidNumber]"
  />
  <a-select
    v-else-if="header.type === 'dropdown' && !header.custom && !header.autocomplete"
    :placeholder="header.multiple ? 'Select answers' : 'Select answer'"
    :value="value"
    @input="onInput"
    :items="items"
    item-text="label"
    item-value="value"
    :multiple="header.multiple"
    :disabled="disabled"
    hide-details
    outlined
    selectionSlot
    cssFlexNoWrap
    cssOneLineSpan
  >
    <template v-slot:selection="{ item, index }">
      <matrix-cell-selection-label :label="item.label" :index="index" :value="value" />
    </template>
  </a-select>
  <a-select
    engineering="autocomplete"
    v-else-if="header.type === 'dropdown' && !header.custom && header.autocomplete"
    ref="dropdownRef"
    placeholder="Type to search"
    :value="value"
    @input="onDropDownInput"
    :items="items"
    item-text="label"
    item-value="value"
    :delimiters="[',']"
    :return-object="false"
    :multiple="header.multiple"
    :disabled="disabled"
    hide-details
    outlined
    selectionSlot
    cssFlexNoWrap
    cssOneLineSpan
  >
    <template v-slot:selection="{ item, index }">
      <matrix-cell-selection-label :label="item.label" :index="index" :value="value" />
    </template>
  </a-select>
  <a-select
    engineering="combobox"
    v-else-if="header.type === 'dropdown' && header.custom"
    ref="dropdownRef"
    placeholder="Type to search or add custom answer"
    :value="value"
    @input="onDropDownInput"
    :search-input.sync="comboboxSearch"
    :items="items"
    item-text="label"
    item-value="value"
    :delimiters="[',']"
    :return-object="false"
    :multiple="header.multiple"
    :disabled="disabled"
    hide-details
    outlined
    selectionSlot
    noDataSlot
    cssFlexNoWrap
    cssOneLineSpan
  >
    <template v-slot:selection="{ item, index }">
      <matrix-cell-selection-label :label="getDropdownLabel(item)" :index="index" :value="value" />
    </template>
    <template v-slot:no-data>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>
            No values matching "<strong>{{ comboboxSearch }}</strong
            >". Press <kbd>enter</kbd> <span v-if="header.multiple">or <kbd>,</kbd></span> to create a new one
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </template>
  </a-select>
  <a-select
    engineering="autocomplete"
    v-else-if="header.type === 'farmos_field'"
    :items="farmos.farms || []"
    :multiple="header.multiple"
    :value="value"
    @input="onInput"
    :label="value ? value.farmName : null"
    item-text="value.name"
    item-value="value"
    hide-details
    clearable
    outlined
    :disabled="disabled || loading"
    selectionSlot
    itemSlot
    cssFlexNoWrap
    cssOneLineSpan
  >
    <template v-slot:selection="data" v-if="!!header.multiple">
      <a-chip v-bind="data.attrs" :input-value="data.selected" @click="clickOnChip(data)">
        <span v-html="data.item.label" />
      </a-chip>
    </template>
    <template v-slot:selection="{ item }" v-else>
      <div v-html="item.label" class="d-flex align-center autocomplete-selection"></div>
    </template>

    <template v-slot:item="data" v-if="!!header.multiple">
      <v-list-item-content>
        <v-list-item-title>{{ data.item.label }} </v-list-item-title>
      </v-list-item-content>
    </template>
    <template v-slot:item="{ item }" v-else>
      <div v-html="item.label"></div>
    </template>
  </a-select>

  <a-select
    engineering="autocomplete"
    v-else-if="header.type === 'farmos_planting'"
    :multiple="header.multiple"
    :value="value"
    @input="(v) => onInput(localChange(v))"
    :items="farmos.plantings || []"
    :label="value ? value.farmName : null"
    item-text="value.name"
    item-value="value"
    hide-details
    clearable
    outlined
    :disabled="disabled || loading"
    selectionSlot
    itemSlot
    cssFlexNoWrap
    cssOneLineSpan
  >
    <template v-slot:selection="{ item, index }">
      <matrix-cell-selection-label :html="item.label" :index="index" :value="value" />
    </template>

    <template v-slot:item="data" v-if="!!header.multiple">
      <v-list-item-content>
        <v-list-item-title>{{ data.item.label }} </v-list-item-title>
      </v-list-item-content>
    </template>
    <template v-slot:item="{ item }" v-else>
      <div v-html="item.label"></div>
    </template>
  </a-select>
  <div v-else-if="header.type === 'date'">
    <a-menu
      :close-on-content-click="false"
      v-model="menus[`${index}_${header.value}`]"
      transition="scale-transition"
      offset-y
      max-width="290px"
      min-width="290px"
      :disabled="disabled"
    >
      <template v-slot:activator="{ on, attrs }">
        <a-text-field
          v-on="on"
          v-bind="attrs"
          @click="setActivePickerMonth"
          :value="getDateLabel"
          hide-details
          outlined
          autocomplete="off"
          :disabled="disabled"
          :style="{ pointerEvents: disabled ? 'none' : 'auto' }"
          readonly
        />
      </template>
      <v-date-picker
        :value="value"
        ref="datepickerRef"
        @input="
          (v) => {
            onDateInput(v);
            menus[`${index}_${header.value}`] = false;
          }
        "
        no-title
      />
    </a-menu>
  </div>

  <a-text-field v-else value="unknown cell type" outlined hide-details disabled />
</template>

<script>
import { getValueOrNull } from '@/utils/surveyStack';
import appQrScanner from '@/components/ui/QrScanner.vue';
import { uuidv4 } from '@/utils/surveys';
import MatrixCellSelectionLabel from './MatrixCellSelectionLabel.vue';
import parse from 'date-fns/parse';
import parseISO from 'date-fns/parseISO';
import isValid from 'date-fns/isValid';
import format from 'date-fns/format';

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
        const value = this.item[this.header.value].value;
        if (this.header.type == 'farmos_planting' || this.header.type == 'farmos_field') {
          if (!this.header.multiple && Array.isArray(value)) {
            return value[0];
          }
        }

        if (this.header.type === 'dropdown') {
          const arrayValue = Array.isArray(value) ? value : value ? [value] : [];
          return this.header.multiple ? arrayValue : arrayValue[0] || value;
        }

        return value;
      },
      set(value) {
        let newValue = value;
        if (this.header.type == 'farmos_planting' || this.header.type == 'farmos_field') {
          if (value && !Array.isArray(value)) {
            newValue = [value];
          }
        }
        this.item[this.header.value].value = newValue;
      },
    },
    localValue() {
      if (this.value === null) {
        return '';
      } else {
        return this.value && this.value.name ? this.value.name : '';
      }
    },
    items() {
      const arrayValue = Array.isArray(this.value) ? this.value : this.value ? [this.value] : [];
      return this.getDropdownItems(this.header.value, arrayValue);
    },
    getDateLabel() {
      const date = parseISO(this.value);
      if (!isValid(date)) {
        return '';
      }
      return format(date, 'yyyy-MM-dd');
    },
  },
  methods: {
    clickOnChip(data) {
      data.select;
    },
    isValidNumber(val) {
      return val === '' || val === null || isNaN(Number(val)) ? 'Please enter a number' : true;
    },
    onInput(value) {
      if (this.header.type === 'dropdown') {
        this.value = getValueOrNull(Array.isArray(value) ? value.map(getValueOrNull) : [value]);
      } else {
        this.value = getValueOrNull(Array.isArray(value) ? value.map(getValueOrNull) : value);
      }
      this.$emit('changed');
    },
    onDateInput(value) {
      const isValidFormat = /^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/.test(value);
      const date = parse(value, 'yyyy-MM-dd', new Date());
      if (!isValidFormat || !isValid(date)) {
        return;
      }
      this.value = date.toISOString();
      this.$emit('changed');
    },
    onFarmOsInput(value) {
      if (!this.value || this.value.name !== value) {
        this.value = { id: uuidv4(), name: getValueOrNull(value) };
        this.$emit('changed');
      }
    },
    onNumberInput(value) {
      const numValue = Number(value);
      this.value = isNaN(numValue) ? null : numValue;
      this.$emit('changed');
    },
    onDropDownInput(value) {
      this.onInput(value);
      this.comboboxSearch = null;
      if (this.$refs.dropdownRef && !this.header.multiple) {
        this.$refs.dropdownRef.blur();
      }
    },
    getDropdownLabel(value) {
      const dropdownItems = this.items;
      const found = dropdownItems.find((i) => i.value === value);
      return found ? found.label : value;
    },
    setActivePickerMonth() {
      setTimeout(() => {
        this.$refs.datepickerRef.activePicker = 'MONTH';
      });
    },
    // copied/adapted from FarmOsPlanting.vue
    localChange(hashesArg) {
      if (!hashesArg) {
        return null;
      }

      const hashes = Array.isArray(hashesArg) ? hashesArg : [hashesArg];

      const selectedItems = hashes
        .map((h) => {
          if (typeof h !== 'string') {
            return h;
          }
          return this.farmos.plantings.find((t) => t.value.hash === h).value;
        })
        .filter(Boolean);

      const assets = selectedItems.filter((item) => !item.isField);
      const fields = selectedItems.filter((item) => !!item.isField);
      const assetsToSelect = fields.flatMap((field) =>
        this.farmos.plantings.filter(
          (item) =>
            !item.value.isField &&
            item.value.farmName === field.farmName &&
            item.value.location.some((loc) => loc.id === field.location.id)
        )
      );
      const noneExist = assetsToSelect
        .filter(
          (asset) => !assets.some(({ id, farmName }) => farmName === asset.value.farmName && id === asset.value.id)
        )
        .map((asset) => asset.value);
      assets.push(...noneExist);

      if (!Array.isArray(hashesArg)) {
        return assets[0];
      }

      return assets;
    },
  },
};
</script>

<style scoped>
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
