<template>
  <v-date-picker
    :color="color"
    :hide-header="noTitle"
    :show-adjacent-months="showAdjacentMonths"
    :viewMode="type !== 'date' ? type : undefined"
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)" />
</template>

<script>
/*
V3 datepicker appears way larger than v2
- no density prop so far
- tried sass variables without effect:
      $date-picker-table-date-button-height: 16px,
      $date-picker-table-date-button-width: 16px,
      $date-picker-table-date-width: 30px,
 */
export default {
  // click event listened to by slot:activator
  emits: ['update:modelValue'],
  props: {
    //vuetify props
    color: { type: String, required: false },
    noTitle: { type: Boolean, required: false },
    showAdjacentMonths: { type: Boolean, required: false },
    type: { type: String, default: 'date' }, //TODO not implemented in V3, see https://github.com/vuetifyjs/vuetify/issues/17950
    modelValue: { type: undefined, required: false },
  },
};
</script>
