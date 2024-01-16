<template>
  <v-date-picker
    ref="refDatePicker"
    :color="color"
    :hide-header="noTitle"
    :range="range"
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
    range: { type: Boolean, required: false }, //TODO IN DEVELOPMENT https://github.com/vuetifyjs/vuetify/issues/18701
    showAdjacentMonths: { type: Boolean, required: false },
    type: { type: String, default: 'date' }, //TODO https://github.com/vuetifyjs/vuetify/issues/17950
    modelValue: { type: undefined, required: false },
  },
  methods: {
    setActivePickerToYear() {
      //TODO remove  this?
      this.$refs.refDatePicker.viewMode = 'year';
    },
  },
};
</script>
