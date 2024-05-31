<template>
  <a-select
    v-if="type === 'date-year'"
    :modelValue="getYearModelValue"
    @update:modelValue="emitYear"
    clearable
    :class="{
      minWidth290px: cssminWidth290px,
    }"
    :dense="dense"
    :hideDetails="hideDetails"
    :items="years()"
    :label="label"
    :menu-props="{ offsetY: true }"
    :prependInnerIcon="prependInnerIcon"
    :type="yearType"
    :variant="variant" />
  <a-menu
    v-else
    v-model="state.datePickerIsVisible"
    :close-on-content-click="false"
    location="bottom"
    :min-width="menuMinWidth"
    transition="scale-transition">
    <template v-slot:activator="{ props }">
      <a-text-field
        v-bind="props"
        :modelValue="dateFormatted"
        @blur="$emit('blur')"
        @click:clear="setToNull"
        :class="{
          minWidth290px: cssminWidth290px,
        }"
        clearable
        :color="color"
        :dense="dense"
        :hide-details="hideDetails"
        :label="label"
        :persistent-hint="persistentHint"
        :prependInnerIcon="prependInnerIcon"
        readonly
        :variant="variant" />
    </template>
    <a-date-picker
      :modelValue="dateForPicker"
      @update:modelValue="updateDatePicker"
      :color="color"
      no-title
      show-adjacent-months
      :type="datePickerType" />
  </a-menu>
</template>
<script setup>
import { reactive, computed } from 'vue';

import format from 'date-fns/format';
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import startOfWeek from 'date-fns/startOfWeek';
import endOfWeek from 'date-fns/endOfWeek';
import getWeekOfMonth from 'date-fns/getWeekOfMonth';
import { zonedTimeToUtc } from 'date-fns-tz';

const props = defineProps({
  cssminWidth290px: { type: Boolean, required: false },
  modelValue: { type: undefined, required: false },
  color: { type: String, required: false },
  dense: { type: Boolean, required: false },
  hideDetails: { type: [Boolean, String], required: false },
  label: { type: String, required: false },
  menuMinWidth: { type: String, required: false },
  menuProps: { type: [String, Array, Object], required: false },
  persistentHint: { type: Boolean, required: false },
  prependInnerIcon: { type: String, required: false },
  readonly: { type: Boolean, required: false },
  type: { type: String, required: false },
  variant: { type: String, required: false },
  yearType: { type: String, required: false },
});
const emit = defineEmits(['blur', 'update:modelValue']);

const state = reactive({
  datePickerIsVisible: false,
});

const getYearModelValue = computed(() => {
  return props.modelValue ? Number(props.modelValue.substring(0, 4)) : null;
});

const dateFormatted = computed(() => {
  if (!isValid(parseISO(props.modelValue))) {
    return null;
  }
  return dateFormat(props.type, dateForPicker.value);
});

const datePickerType = computed(() => {
  switch (props.type) {
    case 'date-month-year':
      return 'months';
    default:
      return 'date';
  }
});

const dateForPicker = computed(() => {
  if (props.type === 'date-week-month-year') {
    if (props.modelValue) {
      const date = props.modelValue.slice(0, -1);
      const start = new Date(startOfWeek(parseISO(date)));
      const end = new Date(endOfWeek(parseISO(date)));
      const current = start;
      const range = [];
      while (current <= end) {
        range.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      return range;
    } else {
      return [];
    }
  } else {
    if (props.modelValue) {
      // remove the Z which indicates the timezone
      return new Date(props.modelValue.slice(0, -1));
    } else {
      return null;
    }
  }
});

const years = () => {
  const years = [];
  const maxYear = new Date().getFullYear() + 100;
  for (let i = 1900; i <= maxYear; i++) {
    years.push(i);
  }
  return years;
};

const setToNull = () => {
  updateDatePicker(null);
};

const emitYear = ($event) => {
  if (typeof $event === 'number') {
    emit('update:modelValue', new Date(Date.UTC($event, 0, 1)).toISOString()); // set to first day of year
  } else {
    emit('update:modelValue', null);
  }
};

const updateDatePicker = (date) => {
  if (date === null) {
    emit('update:modelValue', null);
  } else {
    state.datePickerIsVisible = false;
    const utcDateStr = zonedTimeToUtc(date).toISOString();
    emit('update:modelValue', utcDateStr);
  }
};

const dateFormat = (type, value) => {
  switch (type) {
    case 'date-month-year':
      return format(value, 'yyyy-MM');
    // case 'date-year': not defined here
    //   return format(value, 'yyyy');
    case 'date-week-month-year':
      return format(new Date(startOfWeek(value[0])), 'yyyy-MM-dd');
    default: //case 'date' or no type selected for old survey
      return format(value, 'yyyy-MM-dd');
  }
};
</script>

<style scoped lang="scss">
.minWidth290px {
  min-width: 290px;
}
</style>
