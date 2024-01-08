<template>
  <a-select
    v-if="type === 'date-year'"
    label="Default value"
    v-model="year"
    :modelValue="getYear"
    @update:modelValue="setYear"
    :items="years"
    :menu-props="{ offsetY: true }"
    :dense="dense"
    clearable
    hide-details
  />
  <a-menu
    v-else
    v-model="menuIsOpen"
    :close-on-content-click="false"
    transition="scale-transition"
    location="bottom"
    min-width="auto"
  >
    <template v-slot:activator="{ props }">
      <a-text-field
        v-bind="props"
        :modelValue="formattedDate"
        @update:modelValue="onChange"
        @blur="$emit('blur')"
        label="Default value"
        class="mt-3"
        :dense="dense"
        readonly
        clearable
        hide-details
      />
    </template>
    <a-date-picker
      v-model="date"
      @input="menuIsOpen = false"
      :type="type === 'date-month-year' ? 'month' : 'date'"
      :range="type === 'date-week-month-year'"
      show-adjacent-months
      no-title
      scrollable
    />
  </a-menu>
</template>

<script>
import parse from 'date-fns/parse';
import parseISO from 'date-fns/parseISO';
import isValid from 'date-fns/isValid';
import format from 'date-fns/format';
import startOfDay from 'date-fns/startOfDay';
import startOfWeek from 'date-fns/startOfWeek';
import endOfWeek from 'date-fns/endOfWeek';
import startOfMonth from 'date-fns/startOfMonth';
import startOfYear from 'date-fns/startOfYear';
import getWeekOfMonth from 'date-fns/getWeekOfMonth';

export default {
  emits: ['blur', 'input'],
  props: {
    modelValue: { type: String },
    type: { type: String },
    dense: { type: Boolean, default: false },
  },

  data() {
    return {
      value: this.modelValue,
      menuIsOpen: false,
    };
  },
  computed: {
    dateValue() {
      const parsedDate = parseISO(this.value);
      return isValid(parsedDate) ? parsedDate : new Date();
    },
    formatter() {
      return this.type === 'date-month-year' ? 'yyyy-MM' : 'yyyy-MM-dd';
    },
    date: {
      get() {
        return this.type === 'date-week-month-year'
          ? [format(startOfWeek(this.dateValue), this.formatter), format(endOfWeek(this.dateValue), this.formatter)]
          : format(this.dateValue, this.formatter);
      },
      set(date) {
        if (!this.menuIsOpen) {
          return;
        }
        const pickedDate = Array.isArray(date) ? date[0] : date;
        let target = new Date(pickedDate);

        if (!isValid(target)) {
          this.$emit('update:modelValue', null);
          return;
        }
        // + 1 day due to GMT
        target.setDate(target.getDate() + 1);

        if (this.type === 'date') {
          target = startOfDay(target);
        } else if (this.type === 'date-month-year') {
          target = startOfMonth(target);
          if (target.getTimezoneOffset() < 0) {
            target.setDate(target.getDate() + 1);
          }
        } else if (this.type === 'date-year') {
          target = startOfYear(target);
        } else if (this.type === 'date-week-month-year') {
          target = startOfWeek(target);
          if (target.getTimezoneOffset() < 0) {
            target.setDate(target.getDate() + 1);
          }
        }

        // remove 'Z'
        const result = target.toISOString().slice(0, -1);

        this.$emit('update:modelValue', result);
      },
    },
    years() {
      const years = [];
      const maxYear = new Date().getFullYear() + 100;
      for (let i = 1970; i <= maxYear; i++) {
        years.push(i);
      }
      return years;
    },
    formattedDate() {
      if (!isValid(parseISO(this.value))) {
        return '';
      } else if (this.type === 'date') {
        return format(this.dateValue, 'yyyy-MM-dd');
      } else if (this.type === 'date-month-year') {
        return format(this.dateValue, 'yyyy-MM');
      } else if (this.type === 'date-year') {
        return format(this.dateValue, 'yyyy');
      } else if (this.type === 'date-week-month-year') {
        return format(this.dateValue, 'yyyy-MM') + ` ${getWeekOfMonth(this.dateValue)}w`;
      }
      return '';
    },
  },
  methods: {
    getYear() {
      return this.value ? Number(this.value.substring(0, 4)) : null;
    },
    setYear(year) {
      if (typeof year === 'number') {
        this.$emit('update:modelValue', new Date(year, 1, 0).toISOString());
      } else {
        this.$emit('update:modelValue', null);
      }
    },
    onChange(value) {
      if (!value) {
        this.$emit('update:modelValue', null);
      }
    },
  },
};
</script>
