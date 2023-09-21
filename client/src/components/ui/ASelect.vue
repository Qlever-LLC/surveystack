<template>
  <v-select
    v-if="engineering === 'select'"
    v-on="$listeners"
    v-bind="$attrs"
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
</template>

<script>
export default {
  emits: ['input', 'change', 'focus', 'blur'],
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
    //named slot
    selectionSlot: { type: Boolean, required: false },
    itemSlot: { type: Boolean, required: false },
    appendOuterSlot: { type: Boolean, required: false },
    //non vuetify props
    dataTestId: { type: String, required: false },
    //vuetify props
    chips: { type: Boolean, required: false },
    clearable: { type: Boolean, required: false },
    color: { type: String, required: false },
    deletableChips: { type: Boolean, required: false },
    dense: { type: Boolean, required: false },
    disabled: { type: Boolean, required: false },
    hideDetails: { type: [Boolean, String], required: false },
    hint: { type: String, required: false },
    itemText: { type: undefined, required: false },
    itemValue: { type: undefined, required: false },
    items: { type: Array, required: false },
    label: { type: String, required: false },
    menuProps: { type: [String, Array, Object], required: false },
    multiple: { type: Boolean, required: false },
    outlined: { type: Boolean, required: false },
    persistentHint: { type: Boolean, required: false },
    placeholder: { type: String, required: false },
    readonly: { type: Boolean, required: false },
    returnObject: { type: Boolean, required: false },
    value: { type: undefined, required: false },
  },
};
</script>

<style>
.v-select .v-select__selections > input:not(:first-child) {
  margin-left: 4px;
}
</style>
