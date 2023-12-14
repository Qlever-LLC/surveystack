<template>
  <v-select
    v-if="engineering === 'select'"
    @blur="$emit('blur')"
    @change="$emit('change', $event)"
    @focus="$emit('focus')"
    @input="$emit('input', $event)"
    :class="{
      minHeightAuto: cssMinHeightAuto,
      minHeight56px: cssMinHeight56px,
      flexWrap: cssFlexWrap,
      flexNoWrap: cssFlexNoWrap,
      oneLineSpan: cssOneLineSpan,
    }"
    :data-test-id="dataTestId"
    :chips="chips"
    :clearable="clearable"
    :color="color"
    :deletable-chips="deletableChips"
    :dense="dense"
    :disabled="disabled"
    :hide-details="hideDetails"
    :hint="hint"
    :item-text="itemText"
    :item-value="itemValue"
    :items="items"
    :label="label"
    :menu-props="menuProps"
    :multiple="multiple"
    :outlined="outlined"
    :persistent-hint="persistentHint"
    :placeholder="placeholder"
    :readonly="readonly"
    :return-object="returnObject"
    :value="value"
  >
    <template v-if="selectionSlot" v-slot:selection="{ item, index }">
      <slot name="selection" :item="item" :index="index" />
    </template>

    <template v-if="itemSlot" v-slot:item="{ item, on, attrs }">
      <slot name="item" :item="item" :on="on" :attrs="attrs" />
    </template>

    <template v-if="appendOuterSlot" v-slot:append-outer>
      <slot name="append-outer" />
    </template>
  </v-select>

  <v-autocomplete
    v-else-if="engineering === 'autocomplete'"
    ref="selectRef"
    @blur="$emit('blur')"
    @change="$emit('change', $event)"
    @click:append-outer="$emit('click:append-outer', $event)"
    @focus="$emit('focus', $event)"
    @input="$emit('input', $event)"
    @keyup.enter="$emit('keyup.enter')"
    :class="{
      minHeightAuto: cssMinHeightAuto,
      minHeight56px: cssMinHeight56px,
      flexWrap: cssFlexWrap,
      flexNoWrap: cssFlexNoWrap,
      oneLineSpan: cssOneLineSpan,
    }"
    :data-test-id="dataTestId"
    :delimiters="delimiters"
    :primary="primary"
    :append-outer-icon="appendOuterIcon"
    :chips="chips"
    :clearable="clearable"
    :color="color"
    :dark="dark"
    :deletable-chips="deletableChips"
    :dense="dense"
    :disabled="disabled"
    :filled="filled"
    :hide-details="hideDetails"
    :hint="hint"
    :item-text="itemText"
    :item-value="itemValue"
    :items="items"
    :label="label"
    :loading="loading"
    :menu-props="menuProps"
    :multiple="multiple"
    :open-on-clear="openOnClear"
    :outlined="outlined"
    :placeholder="placeholder"
    :return-object="returnObject"
    :rounded="rounded"
    :rules="rules"
    :small-chips="smallChips"
    :solo="solo"
    :single-line="singleLine"
    :value="value"
  >
    <template v-if="selectionSlot" v-slot:selection="{ item, index }">
      <slot name="selection" :item="item" :index="index" />
    </template>

    <template v-if="itemSlot" v-slot:item="{ item }">
      <slot name="item" :item="item" />
    </template>

    <template v-if="appendOuterSlot" v-slot:append-outer>
      <slot name="append-outer" />
    </template>

    <template v-if="prependItemSlot" v-slot:prepend-item>
      <slot name="prepend-item" />
    </template>
  </v-autocomplete>

  <v-combobox
    v-else-if="engineering === 'combobox'"
    ref="selectRef"
    @blur="$emit('blur')"
    @change="onChange"
    @focus="$emit('focus', $event)"
    @input="onInput"
    @update:search-input="onSearchInputUpdate"
    :class="{
      minHeightAuto: cssMinHeightAuto,
      minHeight56px: cssMinHeight56px,
      flexWrap: cssFlexWrap,
      flexNoWrap: cssFlexNoWrap,
      oneLineSpan: cssOneLineSpan,
    }"
    :data-test-id="dataTestId"
    :delimiters="delimiters"
    :chips="chips"
    :clearable="clearable"
    :color="color"
    :dense="dense"
    :hide-details="hideDetails"
    :disabled="disabled"
    :item-text="itemText"
    :item-value="itemValue"
    :items="items"
    :label="label"
    :menu-props="menuProps"
    :multiple="multiple"
    :outlined="outlined"
    :placeholder="placeholder"
    :return-object="returnObject"
    :search-input="internalSearch"
    :value="value"
  >
    <template v-if="selectionSlot" v-slot:selection="{ item, index }">
      <slot name="selection" :item="item" :index="index" />
    </template>

    <template v-if="noDataSlot" v-slot:no-data>
      <slot name="no-data" />
    </template>
  </v-combobox>
</template>

<script>
// import { ref } from 'vue';

export default {
  emits: ['blur', 'change', 'click:append-outer', 'focus', 'input', 'keyup.enter', 'update:search-input'],
  props: {
    //TODO @benoit: try to remove this prop:
    //do we ever need select? imho its just autocomplete without text input, we could always offer text input and remove v-select here
    //combobox is just autocomplete with manual input of a not-yet-existing item
    //so instead of engineering, we could just add a prop "allowCustomItem" (boolean). If true, use combobox, else use autocomplete
    engineering: {
      validator: function (value) {
        // The value must match one of these strings
        return ['select', 'autocomplete', 'combobox'].includes(value);
      },
      default: 'select',
      required: false,
    },
    /* Named slot set to true to render slot
      Example:
      <a-select ... selectionSlot>
        <template v-slot:selection="data">
      </a-select>
    */
    selectionSlot: { type: Boolean, required: false },
    itemSlot: { type: Boolean, required: false },
    appendOuterSlot: { type: Boolean, required: false },
    prependItemSlot: { type: Boolean, required: false },
    noDataSlot: { type: Boolean, required: false },
    //non vuetify props
    cssMinHeightAuto: { type: Boolean, required: false },
    cssMinHeight56px: { type: Boolean, required: false },
    cssFlexWrap: { type: Boolean, required: false },
    cssFlexNoWrap: { type: Boolean, required: false },
    cssOneLineSpan: { type: Boolean, required: false },
    dataTestId: { type: String, required: false },
    delimiters: { type: Array, required: false },
    primary: { type: Boolean, required: false },
    //vuetify props
    appendOuterIcon: { type: String, required: false },
    chips: { type: Boolean, required: false },
    clearable: { type: Boolean, required: false },
    color: { type: String, required: false },
    dark: { type: Boolean, required: false },
    deletableChips: { type: Boolean, required: false },
    dense: { type: Boolean, required: false },
    disabled: { type: Boolean, required: false },
    filled: { type: Boolean, required: false },
    filter: { type: Function, required: false },
    hideDetails: { type: [Boolean, String], required: false },
    hint: { type: String, required: false },
    itemText: { type: [String, Array, Function], required: false },
    itemValue: { type: [String, Array, Function], required: false },
    items: { type: Array, required: false },
    label: { type: String, required: false },
    loading: { type: Boolean, required: false },
    menuProps: { type: [String, Array, Object], required: false },
    multiple: { type: Boolean, required: false },
    openOnClear: { type: Boolean, required: false },
    outlined: { type: Boolean, required: false },
    persistentHint: { type: Boolean, required: false },
    placeholder: { type: String, required: false },
    readonly: { type: Boolean, required: false },
    returnObject: { type: Boolean, required: false },
    rounded: { type: Boolean, required: false },
    rules: { type: Array, required: false },
    searchInput: { type: String, required: false },
    singleLine: { type: Boolean, required: false },
    smallChips: { type: Boolean, required: false },
    solo: { type: Boolean, required: false },
    value: { type: undefined, required: false },
  },

  //TODO Vue3 Composition API causes error in several Unit Tests

  // setup(props, { emit }) {
  //   const selectRef = ref(null);
  //   const internalSearch = ref(props.searchInput);
  //   const multiple = ref(props.multiple);

  //   function blur() {
  //     selectRef.value.blur();
  //   }

  //   function onSearchInputUpdate(newVal) {
  //     internalSearch.value = newVal;
  //     emit('update:search-input', newVal);
  //   }

  //   function onChange(val) {
  //     if (multiple.value || internalSearch.value !== null) {
  //       emit('change', val);
  //     }
  //     internalSearch.value = null;
  //   }
  //   function onInput(val) {
  //     if (multiple.value || internalSearch.value !== null) {
  //       emit('input', val);
  //     }
  //   }

  //   return {
  //     selectRef,
  //     internalSearch,
  //     blur,
  //     onSearchInputUpdate,
  //     onChange,
  //     onInput,
  //   };
  // },
  data() {
    return {
      internalSearch: this.searchInput,
    };
  },
  methods: {
    blur() {
      this.$refs.selectRef.blur();
    },
    onSearchInputUpdate(newVal) {
      this.internalSearch = newVal;
      this.$emit('update:search-input', newVal);
    },
    onChange(val) {
      if (this.multiple || this.internalSearch) {
        this.$emit('change', val);
      }
      this.internalSearch = null;
    },
    onInput(val) {
      if (this.multiple || this.internalSearch) {
        this.$emit('input', val);
      }
    },
  },
};
</script>

<style>
.v-select .v-select__selections > input:not(:first-child) {
  margin-left: 4px;
}

.minHeightAuto .v-select__selections {
  min-height: auto !important;
}
.minHeight56px .v-select__selections {
  min-height: 56px !important;
}
.flexWrap .v-select__selections {
  flex-wrap: wrap !important;
}
.flexNoWrap .v-select__selections {
  flex-wrap: nowrap;
}
.oneLineSpan .v-select__selections span {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>
