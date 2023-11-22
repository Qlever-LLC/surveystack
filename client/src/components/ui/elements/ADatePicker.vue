<template>
  <v-date-picker
    ref="refDatePicker"
    @change="handleCustomChange"
    @input="$emit('input', $event)"
    :color="color"
    :no-title="noTitle"
    :range="range"
    :reactive="reactive"
    :scrollable="scrollable"
    :show-adjacent-months="showAdjacentMonths"
    :type="type"
    :value="value"
  />
</template>

<script>
export default {
  // click event listened to by slot:activator
  emits: ['change', 'input'],
  props: {
    //vuetify props
    color: { type: String, required: false },
    noTitle: { type: Boolean, required: false },
    range: { type: Boolean, required: false },
    reactive: { type: Boolean, required: false },
    scrollable: { type: Boolean, required: false },
    showAdjacentMonths: { type: Boolean, required: false },
    type: { type: String, required: false },
    value: { type: undefined, required: false },
  },
  methods: {
    setActivePickerToYear() {
      this.$refs.refDatePicker.activePicker = 'YEAR';
    },
    handleCustomChange(event) {
      // @change emits input for v-model case
      this.$emit('input', event);
      this.$emit('change', event);
    },
  },
};
</script>
