<template>
  <v-select
    v-if="renderSelect"
    ref="selectRef"
    :modelValue="getModelValue"
    @update:modelValue="clearSearchAndEmitAutocompleteUpdate"
    v-model:search="internalSearch"
    @blur="$emit('blur')"
    @click:append="$emit('click:append', $event)"
    @focus="$emit('focus')"
    :class="{
      minHeightAuto: cssMinHeightAuto,
      minHeight56px: cssMinHeight56px,
      flexWrap: cssFlexWrap,
      flexNoWrap: cssFlexNoWrap,
      oneLineSpan: cssOneLineSpan,
    }"
    :append-icon="appendIcon"
    :chips="chips"
    :clearable="clearable"
    :closable-chips="closableChips"
    :color="color"
    :custom-filter="customFilter"
    :data-test-id="dataTestId"
    :density="dense ? 'compact' : 'default'"
    :disabled="disabled"
    :hide-details="hideDetails"
    :hint="hint"
    :items="items"
    :item-title="itemTitle"
    :item-value="itemValue"
    :label="label"
    :loading="loading"
    :menu-props="menuProps"
    :multiple="multiple"
    :variant="variant"
    :persistent-hint="persistentHint"
    :persistent-placeholder="placeholder ? true : false"
    :placeholder="placeholder"
    :prependInnerIcon="prependInnerIcon"
    :primary="primary"
    :readonly="readonly"
    :return-object="returnObject"
    :rounded="rounded"
    :rules="rules"
    :type="type"
    :single-line="singleLine">
    <template v-if="selectionSlot" v-slot:selection="{ item, index }">
      <slot name="selection" :item="item" :index="index" />
    </template>

    <template v-if="chipSlot" v-slot:chip="{ props, item, index }">
      <slot name="chip" :props="props" :item="item" :index="index" />
    </template>

    <template v-if="itemSlot" v-slot:item="{ props, item }">
      <slot name="item" :props="props" :item="item" />
    </template>

    <template v-if="prependItemSlot" v-slot:prepend-item>
      <slot name="prepend-item" />
    </template>

    <template v-if="appendSlot" v-slot:append>
      <slot name="append" />
    </template>
  </v-select>

  <v-autocomplete
    v-else-if="renderAutocomplete"
    ref="selectRef"
    :modelValue="getModelValue"
    @update:modelValue="clearSearchAndEmitAutocompleteUpdate"
    v-model:search="internalSearch"
    @blur="$emit('blur')"
    @click:append="$emit('click:append', $event)"
    @focus="$emit('focus')"
    :class="{
      minHeightAuto: cssMinHeightAuto,
      minHeight56px: cssMinHeight56px,
      flexWrap: cssFlexWrap,
      flexNoWrap: cssFlexNoWrap,
      oneLineSpan: cssOneLineSpan,
    }"
    :append-icon="appendIcon"
    :chips="chips"
    :clearable="clearable"
    :closable-chips="closableChips"
    :color="color"
    :custom-filter="customFilter"
    :data-test-id="dataTestId"
    :density="dense ? 'compact' : 'default'"
    :disabled="disabled"
    :hide-details="hideDetails"
    :hint="hint"
    :items="items"
    :item-title="itemTitle"
    :item-value="itemValue"
    :label="label"
    :loading="loading"
    :menu-props="menuProps"
    :multiple="multiple"
    :variant="variant"
    :persistent-hint="persistentHint"
    :persistent-placeholder="placeholder ? true : false"
    :placeholder="placeholder"
    :prependInnerIcon="prependInnerIcon"
    :primary="primary"
    :readonly="readonly"
    :return-object="returnObject"
    :rounded="rounded"
    :rules="rules"
    :type="type"
    :single-line="singleLine">
    <template v-if="selectionSlot" v-slot:selection="{ item, index }">
      <slot name="selection" :item="item" :index="index" />
    </template>

    <template v-if="chipSlot" v-slot:chip="{ props, item, index }">
      <slot name="chip" :props="props" :item="item" :index="index" />
    </template>

    <template v-if="itemSlot" v-slot:item="{ props, item }">
      <slot name="item" :props="props" :item="item" />
    </template>

    <template v-if="prependItemSlot" v-slot:prepend-item>
      <slot name="prepend-item" />
    </template>

    <template v-if="appendSlot" v-slot:append>
      <slot name="append" />
    </template>
  </v-autocomplete>

  <v-combobox
    v-else-if="allowCustomItem"
    ref="selectRef"
    :modelValue="getModelValue"
    @update:modelValue="updateValue"
    v-model:search="inputSearch"
    :menu="noDataMenu"
    @update:menu="updateMenu"
    @blur="$emit('blur')"
    @focus="$emit('focus', $event)"
    @keydown.enter="closeNoDataMenu"
    :class="{
      minHeightAuto: cssMinHeightAuto,
      minHeight56px: cssMinHeight56px,
      flexWrap: cssFlexWrap,
      flexNoWrap: cssFlexNoWrap,
      oneLineSpan: cssOneLineSpan,
    }"
    :chips="chips"
    :clearable="clearable"
    :color="color"
    :data-test-id="dataTestId"
    :delimiters="delimiters"
    :density="dense ? 'compact' : 'default'"
    :hide-details="hideDetails"
    :hide-no-data="false"
    :hide-selected="multiple ? false : true"
    :disabled="disabled"
    :items="items"
    :item-title="itemTitle"
    :item-value="itemValue"
    :label="label"
    :menu-props="menuProps"
    :multiple="multiple"
    :variant="variant"
    :persistent-placeholder="placeholder ? true : false"
    :placeholder="placeholder"
    :return-object="returnObject"
    :type="type">
    <template v-if="selectionSlot" v-slot:selection="{ item, index }">
      <slot name="selection" :item="item" :index="index" />
    </template>

    <template v-if="multiple" v-slot:chip="{ props, item, index }">
      <slot name="chip" :props="props" :item="item" :index="index" />
    </template>

    <template v-slot:no-data>
      <v-list-item>
        <v-list-item-title v-if="inputSearch">
          No results matching "<strong>{{ inputSearch }}</strong
          >". Press <kbd>enter</kbd> <span v-if="multiple">or<kbd>,</kbd></span
          >to create a new one
        </v-list-item-title>
        <v-list-item-title v-else
          >Input your own value {{ inputSearch }} and press <kbd>enter</kbd> <span v-if="multiple">or<kbd>,</kbd></span
          >to create a new one
        </v-list-item-title>
      </v-list-item>
    </template>
  </v-combobox>
</template>

<script>
import * as constants from '@/constants';
export default {
  emits: ['blur', 'click:append', 'focus', 'update:modelValue', 'update:search'],
  props: {
    //Don't use v-select because its just autocomplete without text input, we could always offer text input and remove v-select here
    //combobox is just autocomplete with manual input of a not-yet-existing item
    //so to know which one to use, we just add a prop "allowCustomItem" (boolean). If true, use combobox, else use autocomplete
    allowCustomItem: { type: Boolean, required: false, default: false },
    /* Named slot set to true to render slot
      Example:
      <a-select ... selectionSlot>
        <template v-slot:selection="{ item, index }">
      </a-select>
    */
    selectionSlot: { type: Boolean, required: false },
    itemSlot: { type: Boolean, required: false },
    appendSlot: { type: Boolean, required: false },
    prependItemSlot: { type: Boolean, required: false },
    //non vuetify props
    cssMinHeightAuto: { type: Boolean, required: false },
    cssMinHeight56px: { type: Boolean, required: false },
    cssFlexWrap: { type: Boolean, required: false },
    cssFlexNoWrap: { type: Boolean, required: false },
    cssOneLineSpan: { type: Boolean, required: false },
    dataTestId: { type: String, required: false },
    delimiters: { type: Array, required: false },
    primary: { type: Boolean, required: false },
    //vuetify v-model props
    modelValue: { type: undefined, required: false },
    //vuetify props
    appendIcon: { type: undefined, required: false },
    chips: { type: Boolean, required: false },
    chipSlot: { type: Boolean, required: false },
    clearable: { type: Boolean, required: false },
    closableChips: { type: Boolean, required: false },
    color: { type: String, required: false },
    customFilter: { type: Function, required: false },
    dense: { type: Boolean, required: false },
    disabled: { type: Boolean, required: false },
    hideDetails: { type: [Boolean, String], required: false },
    hint: { type: String, required: false },
    items: { type: Array, required: false },
    itemTitle: { type: [String, Array, Function], required: false },
    itemValue: { type: [String, Array, Function], required: false },
    label: { type: String, required: false },
    loading: { type: [String, Boolean], required: false },
    menuProps: { type: [String, Array, Object], required: false },
    multiple: { type: Boolean, required: false },
    openOnClear: { type: Boolean, required: false },
    persistentHint: { type: Boolean, required: false },
    placeholder: { type: String, required: false },
    prependInnerIcon: { type: String, required: false },
    readonly: { type: Boolean, required: false },
    returnObject: { type: Boolean, required: false },
    rounded: { type: [String, Number, Boolean], required: false },
    rules: { type: Array, required: false },
    singleLine: { type: Boolean, required: false },
    type: { type: String, required: false }, //sets input type, default 'text', alternatives may be 'number', 'date', ...
    variant: {
      type: String,
      validator: function (value) {
        return ['underlined', 'outlined', 'filled', 'solo', 'solo-inverted', 'solo-filled', 'plain'].includes(value);
      },
      default: 'underlined',
      required: false,
    },
  },

  data() {
    return {
      internalSearch: null,
      inputSearch: null,
      noDataMenu: false,
    };
  },
  computed: {
    getModelValue() {
      return this.modelValue && this.modelValue !== '' ? this.modelValue : null;
    },
    renderSelect() {
      return !this.allowCustomItem && this.items.length < constants.ASELECT_MAX_ITEMS_TOBE_VSELECT;
    },
    renderAutocomplete() {
      return !this.allowCustomItem && this.items.length >= constants.ASELECT_MAX_ITEMS_TOBE_VSELECT;
    },
  },
  methods: {
    clearSearchAndEmitAutocompleteUpdate(ev) {
      if (this.multiple) {
        this.internalSearch = null;
      }
      this.updateValue(ev);
    },
    updateValue(val) {
      this.$emit('update:modelValue', val);
    },
    updateMenu(menuState) {
      this.noDataMenu = menuState;
      if (!menuState) {
        this.$refs.selectRef.blur();
      }
    },
    closeNoDataMenu() {
      if (!this.multiple && this.modelValue) {
        this.updateValue(this.modelValue ? this.modelValue.trim() : null);
        this.noDataMenu = false;
        this.$refs.selectRef.blur();
      }
    },
  },
};
</script>

<style>
.v-select .v-select__selections > input:not(:first-child),
.v-autocomplete .v-autocomplete__selection > input:not(:first-child) {
  margin-left: 4px;
}

.minHeightAuto .v-select__selections,
.minHeightAuto .v-autocomplete__selection {
  min-height: auto !important;
}
.minHeight56px .v-select__selections,
.minHeight56px .v-autocomplete__selection {
  min-height: 56px !important;
}
.flexWrap .v-select__selections,
.flexWrap .v-autocomplete__selection {
  flex-wrap: wrap !important;
}
.flexNoWrap .v-select__selections,
.flexNoWrap .v-autocomplete__selection {
  flex-wrap: nowrap;
}
.oneLineSpan .v-select__selections span,
.oneLineSpan .v-autocomplete__selection span {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.v-input__control {
  flex-grow: 1;
}
</style>
