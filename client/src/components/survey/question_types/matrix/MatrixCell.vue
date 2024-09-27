<template>
  <a-text-field
    v-if="header.type === 'text'"
    :modelValue="value"
    @update:modelValue="onInput"
    variant="outlined"
    hide-details
    autocomplete="off"
    :disabled="disabled"
    clearable />
  <div v-else-if="header.type === 'qrcode'" style="display: flex">
    <div style="flex: 1">
      <a-text-field
        ref="text-qrcode"
        :modelValue="value"
        @update:modelValue="onInput"
        variant="outlined"
        hide-details
        autocomplete="off"
        :disabled="disabled"
        clearable />
    </div>
    <div style="flex: 0; display: flex; align-items: center">
      <app-qr-scanner class="mx-2 py-2" ref="scan-button" small @codeDetected="onInput" />
    </div>
  </div>
  <a-text-field
    v-else-if="header.type === 'farmos_uuid'"
    :modelValue="localValue"
    @update:modelValue="onFarmOsInput"
    variant="outlined"
    hide-details
    autocomplete="off"
    :disabled="disabled"
    clearable
    @click:clear="setToNull" />
  <v-text-field
    v-else-if="header.type === 'number'"
    :modelValue="value"
    @update:modelValue="onNumberInput"
    type="number"
    variant="outlined"
    hide-details="auto"
    :disabled="disabled"
    :rules="[isValidNumber]"
    clearable
    @click:clear="setToNull" />
  <a-select
    v-else-if="header.type === 'dropdown' && !header.custom"
    :placeholder="header.multiple ? 'Select answers' : 'Select answer'"
    :modelValue="value"
    @update:modelValue="onInput"
    :items="items"
    item-title="label"
    item-value="value"
    :multiple="header.multiple"
    :disabled="disabled"
    hide-details
    variant="outlined"
    clearable
    cssFlexNoWrap
    cssOneLineSpan
    :chipSlot="header.multiple"
    :selectionSlot="!header.multiple">
    <template v-slot:selection="{ item, index }">
      <matrix-cell-selection-label :label="item.raw.label" :index="index" :value="value" />
    </template>
    <template v-slot:chip="{ props, item, index }">
      <matrix-cell-selection-label v-bind="props" :label="item.raw.label" :index="index" :value="value" />
    </template>
  </a-select>
  <a-select
    allowCustomItem
    v-else-if="header.type === 'dropdown' && header.custom"
    placeholder="Type to search or add custom answer"
    :modelValue="value"
    @update:modelValue="onDropDownInput"
    :items="items"
    item-title="label"
    item-value="value"
    :delimiters="[',']"
    :return-object="false"
    :multiple="header.multiple"
    :disabled="disabled"
    hide-details
    variant="outlined"
    clearable
    :chipSlot="header.multiple"
    :selectionSlot="!header.multiple"
    cssFlexNoWrap
    cssOneLineSpan>
    <template v-slot:selection="{ item, index }">
      <matrix-cell-selection-label :label="getDropdownLabel(item.value)" :index="index" :value="value" />
    </template>
    <template v-slot:chip="{ props, item, index }">
      <matrix-cell-selection-label v-bind="props" :label="getDropdownLabel(item.value)" :index="index" :value="value" />
    </template>
  </a-select>
  <a-select
    v-else-if="header.type === 'farmos_field'"
    :items="farmos.farms || []"
    :multiple="header.multiple"
    :modelValue="value"
    @update:modelValue="onInput"
    :label="value ? value.farmName : null"
    item-title="value.name"
    item-value="value"
    hide-details
    clearable
    variant="outlined"
    :disabled="disabled || loading"
    color="focus"
    :chipSlot="header.multiple"
    :selectionSlot="!header.multiple"
    itemSlot
    cssFlexNoWrap
    cssOneLineSpan>
    <template v-slot:selection="{ item }">
      <div v-html="item.raw.label"></div>
    </template>
    <template v-slot:chip="{ props, item, index }">
      <matrix-cell-selection-label v-bind="props" :html="item.raw.label" :index="index" :value="value" />
    </template>
    <template v-slot:item="{ props, item }">
      <a-list-item v-bind="props" :title="undefined">
        <a-list-item-title v-html="item.raw.label" />
        <a-list-item-subtitle v-html="item.raw.value.url" />
      </a-list-item>
    </template>
  </a-select>
  <a-select
    v-else-if="header.type === 'farmos_planting'"
    :multiple="header.multiple"
    :modelValue="value"
    @update:modelValue="(v) => onInput(localChange(v))"
    :items="farmos.plantings || []"
    :label="value ? value.farmName : null"
    item-title="value.name"
    item-value="value"
    hide-details
    clearable
    variant="outlined"
    :disabled="disabled || loading"
    color="focus"
    :chipSlot="header.multiple"
    :selectionSlot="!header.multiple"
    itemSlot
    cssFlexNoWrap
    cssOneLineSpan>
    <template v-slot:selection="{ item, index }">
      <matrix-cell-selection-label :html="item.raw.label" :index="index" :value="value" />
    </template>
    <template v-slot:chip="{ props, item, index }">
      <matrix-cell-selection-label v-bind="props" :html="item.raw.label" :index="index" :value="value" />
    </template>
    <template v-slot:item="{ props, item, index }">
      <a-list-item v-bind="props" :title="undefined">
        <template v-slot:prepend="{ isSelected }">
          <a-list-item-action class="ml-2 mr-2" v-if="!item.value.isField">
            <a-checkbox v-if="header.multiple" :modelValue="isSelected" color="focus" hide-details />
            <a-radio-group v-else :modelValue="isSelected" hide-details>
              <a-radio :value="true" color="focus" />
            </a-radio-group>
          </a-list-item-action>
          <a-list-item-title :class="index > 0 ? 'mt-4' : ''">
            {{ item.raw.label }}
            <a-list-item-subtitle v-if="item.value.isField">
              {{ item.raw.value.farmName }}
            </a-list-item-subtitle>
          </a-list-item-title>
        </template>
      </a-list-item>
    </template>
  </a-select>
  <div v-else-if="header.type === 'date'">
    <a-menu
      :close-on-content-click="false"
      v-model="menus[`${index}_${header.value}`]"
      transition="scale-transition"
      location="bottom"
      max-width="290px"
      min-width="290px"
      :disabled="disabled">
      <template v-slot:activator="{ props }">
        <a-text-field
          v-bind="props"
          :modelValue="getDateLabel"
          hide-details
          variant="outlined"
          autocomplete="off"
          :disabled="disabled"
          :style="{ pointerEvents: disabled ? 'none' : 'auto' }"
          readonly
          clearable
          @click:clear="setToNull" />
      </template>
      <a-date-picker
        :modelValue="dateForPicker"
        ref="datepickerRef"
        @update:modelValue="onDateInput($event, index, header)"
        no-title
        :startMonth="getStartMonth()"
        :startYear="getStartYear()" />
    </a-menu>
  </div>

  <!-- used for fakeRow -->
  <a-text-field v-else value="" variant="outlined" hide-details disabled />
</template>

<script>
import { getValueOrNull } from '@/utils/surveyStack';
import appQrScanner from '@/components/ui/QrScanner.vue';
import { uuidv4 } from '@/utils/surveys';
import MatrixCellSelectionLabel from './MatrixCellSelectionLabel.vue';
import parseISO from 'date-fns/parseISO';
import isValid from 'date-fns/isValid';
import format from 'date-fns/format';
import { zonedTimeToUtc } from 'date-fns-tz';
import AListItemSubtitle from '@/components/ui/elements/AListItemSubtitle.vue';

export default {
  components: {
    AListItemSubtitle,
    appQrScanner,
    MatrixCellSelectionLabel,
  },
  props: {
    // TODO imho remove header.autocomplete because we merged v-select and v-autocomplete
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
    dateForPicker() {
      if (this.value) {
        // remove the Z which indicates the timezone
        return new Date(this.value.slice(0, -1));
      } else {
        return null;
      }
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
      return format(this.dateForPicker, 'yyyy-MM-dd');
    },
  },
  methods: {
    isValidNumber(val) {
      return isNaN(Number(val)) || (this.header.required && val === null) ? 'Please enter a number' : true;
    },
    setToNull() {
      this.value = null;
    },
    onInput(value) {
      this.value = getValueOrNull(Array.isArray(value) ? value.map(getValueOrNull) : value);
      this.$emit('changed');
    },
    onDateInput(value, index, header) {
      if (isValid(value)) {
        this.value = zonedTimeToUtc(value).toISOString();
        this.$emit('changed');
      }

      this.menus[`${index}_${header.value}`] = false;
    },
    getStartMonth() {
      return this.header?.startMonth ? String(this.header.startMonth) : undefined;
    },
    getStartYear() {
      return this.header?.startYear ? Number(this.header.startYear.substring(0, 4)) : undefined;
    },
    onFarmOsInput(value) {
      if (value) {
        this.value = { id: uuidv4(), name: getValueOrNull(value) };
      } else {
        this.setToNull();
      }
      this.$emit('changed');
    },
    onNumberInput(value) {
      if (value === '' || value === null || value === undefined) {
        this.value = null;
      } else {
        const numValue = Number(value);
        if (numValue || value === '0') {
          // possibility to write 1e2 => 100
          this.value = numValue;
        }
      }
      this.$emit('changed');
    },
    onDropDownInput(value) {
      this.onInput(value);
    },
    getDropdownLabel(value) {
      const dropdownItems = this.items;
      const found = dropdownItems.find((i) => i.value === value);
      return found ? found.label : value[0] ? value[0] : null;
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

<style scoped lang="scss"></style>
