<template>
  <v-autocomplete
    v-if="type === 'date-year'"
    label="Default value"
    v-model="year"
    :items="years"
    :menu-props="{ offsetY: true }"
    :dense="dense"
    clearable
    hide-details
  />
  <v-menu v-else v-model="open" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
    <template v-slot:activator="{ on, attrs }">
      <v-text-field
        v-on="on"
        v-bind="attrs"
        label="Default value"
        :value="formattedDate"
        @input="onChange"
        :class="$vnode.data.staticClass"
        :dense="dense"
        readonly
        clearable
        hide-details
      />
    </template>
    <a-date-picker
      v-model="date"
      @input="open = false"
      :type="type === 'date-month-year' ? 'month' : 'date'"
      :range="type === 'date-week-month-year'"
      show-adjacent-months
      no-title
      scrollable
    />
  </v-menu>
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
import ADatePicker from '@/components/ui/ADatePicker.vue';

export default {
  components: {
    ADatePicker,
  },
  props: {
    value: { type: String },
    type: { type: String },
    dense: { type: Boolean, default: false },
  },
  data() {
    return {
      open: false,
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
        if (!this.open) {
          return;
        }
        const pickedDate = Array.isArray(date) ? date[0] : date;
        let target = parse(pickedDate, this.formatter, new Date());
        if (!isValid(target)) {
          this.$emit('input', null);
          return;
        }

        if (this.type === 'date') {
          target = startOfDay(target);
        } else if (this.type === 'date-month-year') {
          target = startOfMonth(target);
        } else if (this.type === 'date-year') {
          target = startOfYear(target);
        } else if (this.type === 'date-week-month-year') {
          target = startOfWeek(target);
        }
        this.$emit('input', target.toISOString());
      },
    },
    year: {
      get() {
        return this.value ? Number(this.value.substring(0, 4)) : null;
      },
      set(year) {
        if (typeof year === 'number') {
          this.$emit('input', new Date(year, 0).toISOString());
        } else {
          this.$emit('input', null);
        }
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
    onChange(value) {
      if (!value) {
        this.$emit('input', null);
      }
    },
  },
};
</script>
