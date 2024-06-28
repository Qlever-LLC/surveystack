<template>
  <v-date-picker
    v-if="props.viewMode === 'year'"
    :key="state.keyYearOnly"
    :year="state.year"
    :view-mode="props.viewMode"
    :color="props.color"
    :hide-header="props.noTitle"
    :modelValue="props.modelValue"
    @update:viewMode="handleYearViewMode"
    @update:year="emitValue"
    @click="clickEvent" />
  <v-date-picker
    v-else-if="props.viewMode === 'months'"
    :key="state.keyMonthYear"
    :view-mode="getMonthYearViewMode"
    :year="state.year"
    :month="state.month"
    :color="props.color"
    :hide-header="props.noTitle"
    :modelValue="state.modelValue"
    @update:modelValue="emitValue"
    @update:viewMode="handleMonthYearViewMode"
    @update:year="updateYear_ofMonthYear"
    @update:month="updateMonth_ofMonthYear"
    @click="clickEvent" />
  <v-date-picker
    v-else
    :year="state.year"
    :month="state.month"
    :color="props.color"
    :hide-header="props.noTitle"
    :show-adjacent-months="true"
    :view-mode="props.viewMode"
    :modelValue="state.modelValue"
    @update:modelValue="emitValue" />
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue';

const monthsList = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

/*
V3 datepicker appears way larger than v2
- no density prop so far
- tried sass variables without effect:
      $date-picker-table-date-button-height: 16px,
      $date-picker-table-date-button-width: 16px,
      $date-picker-table-date-width: 30px,
 */

// click event listened to by slot:activator
const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  //vuetify props
  color: { type: String, required: false },
  noTitle: { type: Boolean, required: false },
  showAdjacentMonths: { type: Boolean, required: false },
  startMonth: { type: String, required: false, default: undefined },
  startYear: { type: Number, required: false, default: undefined },
  viewMode: { type: String, default: 'month' },
  modelValue: { type: undefined, required: false },
});

const state = reactive({
  keyYearOnly: 0,
  keyMonthYear: 0,

  monthYearViewMode: props.viewMode,
  month: convertMonthStrToInt(),
  year: props.startYear,
  modelValue: props.modelValue,

  /*
    They are 2 cases:
    - User clicks on an unselected chip => normal behavior
    - User clicks on an already selected chip => @update:modelValue isn't called so I've to emit it manually
  */
  clickOnUnselectredChip_YearOnly: false,
  clickOnUnselectredChip_MonthYear: false,
});

const getMonthYearViewMode = computed(() => {
  return state.monthYearViewMode;
});

function convertMonthStrToInt() {
  return monthsList[props.startMonth];
}

function updateYear_ofMonthYear(year) {
  state.year = year;
}
function updateMonth_ofMonthYear(nbMonth) {
  state.month = nbMonth;
  emitValue(new Date(state.year, state.month, 1));
}

/*
Target: YearOnly and MonthYear types
Aim: change default behavior 
Result: when the user clicks on an already selected year or month chip, he is either redirected into the date-picker or out of it
*/
function clickEvent() {
  if (props.viewMode === 'year') {
    if (!state.clickOnUnselectredChip_YearOnly) {
      emitValue(state.year);
    }
  } else if (props.viewMode === 'months') {
    if (state.monthYearViewMode === 'year' && !state.clickOnUnselectredChip_MonthYear) {
      handleMonthYearViewMode('month');
    }
    if (state.monthYearViewMode === 'months' && !state.clickOnUnselectredChip_MonthYear) {
      emitValue(new Date(state.year, state.month, 1));
    }
    state.clickOnUnselectredChip_MonthYear = false;
  }
}

function emitValue(date) {
  if (props.viewMode === 'year') {
    state.clickOnUnselectredChip_YearOnly = true;
  }
  emit('update:modelValue', date);
}

function handleYearViewMode() {
  state.keyYearOnly += 1;
}

function handleMonthYearViewMode(e) {
  state.clickOnUnselectredChip_MonthYear = true;
  if (e === 'year') {
    state.monthYearViewMode = 'year';
  } else if (e === 'month') {
    state.monthYearViewMode = 'months';
  }
}

onMounted(() => {
  // the key is used to refresh the Vuetify date-picker to correctly set the start option when it starts on a view other than the default "month" view
  setTimeout(() => {
    if (props.viewMode === 'year' && state.keyYearOnly === 0) {
      state.keyYearOnly += 1;
    }
    if (props.viewMode === 'months' && state.keyMonthYear === 0) {
      state.keyMonthYear += 1;
    }
  }, 200);
});
</script>
