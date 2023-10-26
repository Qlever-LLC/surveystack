<template>
  <v-select
    v-if="engineering === 'select'"
    @blur="$emit('blur')"
    @change="$emit('change', $event)"
    @focus="$emit('focus')"
    @input="$emit('input', $event)"
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
    :data-test-id="dataTestId"
    :delimiters="delimiters"
    :primary="primary"
    :append-outer-icon="appendOuterIcon"
    :chips="chips"
    :clearable="clearable"
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
</template>

<script>
export default {
  emits: ['blur', 'change', 'click:append-outer', 'focus', 'input', 'keyup.enter'],
  props: {
    //choose btw select - autocomplete - combobox
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
    //non vuetify props
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
    singleLine: { type: Boolean, required: false },
    smallChips: { type: Boolean, required: false },
    solo: { type: Boolean, required: false },
    value: { type: undefined, required: false },
  },
  methods: {
    blur() {
      this.$refs.selectRef.blur();
    },
  },
};
</script>

<style>
.v-select .v-select__selections > input:not(:first-child) {
  margin-left: 4px;
}
</style>
