<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      :is-modified="meta && !!meta.dateModified"
      @initialize="initialize" />
    <app-control-hint :value="control.hint" />
    <a-row>
      <div :class="{ 'mx-auto': centered }">
        <a-select
          v-if="control.options.subtype === 'date-year'"
          :label="getLabel()"
          :modelValue="dateForPicker ? dateForPicker.substring(0, 4) : undefined"
          @update:modelValue="updateDatePicker"
          :items="years"
          :menu-props="{ offsetY: true }"
          clearable
          hide-details
          variant="outlined"
          prepend-inner-icon="mdi-calendar"
          style="min-width: 290px"
          type="number" />
        <a-menu
          v-else
          v-model="datePickerIsVisible"
          :close-on-content-click="false"
          transition="scale-transition"
          location="bottom">
          <template v-slot:activator="{ props }">
            <a-text-field
              style="min-width: 290px"
              v-bind="props"
              @change="updateDate"
              @update:modelValue="datePickerIsVisible = false"
              :modelValue="dateFormatted"
              :label="getLabel()"
              persistent-hint
              prepend-inner-icon="mdi-calendar"
              readonly
              variant="outlined"
              color="focus"
              clearable
              @click:clear="setToNull" />
          </template>
          <a-date-picker
            ref="picker"
            :modelValue="dateForPicker"
            @update:modelValue="updateDatePicker"
            :type="datePickerType"
            no-title
            color="focus"
            :range="control.options.subtype === 'date-week-month-year'" />
        </a-menu>
      </div>
    </a-row>

    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
const { zonedTimeToUtc } = require('date-fns-tz');

export default {
  mixins: [baseQuestionComponent],
  props: { centered: { type: Boolean, default: true } },
  data() {
    return {
      datePickerIsVisible: false,
      localValue: this.value,
    };
  },
  computed: {
    dateFormatted() {
      return this.localValue ? this.formatDate(new Date(this.value).toISOString().substring(0, 10)) : null;
    },
    dateForPicker() {
      let substrLength;
      switch (this.control.options.subtype) {
        case 'date-month-year':
          substrLength = 7;
          break;
        // case 'date-week-month-year':
        default:
          substrLength = 10;
          break;
      }

      if (this.control.options.subtype === 'date-week-month-year') {
        if (this.value) {
          const date = new Date(this.value);
          // // const start = date.getDate() - date.getDay() - 1; // First day is the day of the month - the day of the week
          // const start = date.getDate();
          // const end = start + 6; // last day is the first day + 6
          // // const end = date.getDate() + 6; // last day is the first day + 6
          // const startDay = new Date(date.setDate(start)).toISOString().substring(0, 10);
          // const endDay = new Date(date.setDate(end)).toISOString().substring(0, 10);
          // console.log(startDay, endDay);
          // return [
          //   new Date(date.setDate(start)).toISOString().substring(0, 10),
          //   new Date(date.setDate(end)).toISOString().substring(0, 10),
          // ];
          return [
            date.toISOString().substring(0, 10),
            new Date(date.setDate(date.getDate() + 6)).toISOString().substring(0, 10),
          ];
        }
        return [];
      }

      if (this.value) {
        return new Date(this.value); //.toISOString().substring(0, substrLength);
      }

      return null;
    },
    dateType() {
      return (this.control && this.control.options && this.control.options.subtype) || 'date';
    },
    datePickerType() {
      switch (this.control.options.subtype) {
        case 'date-month-year':
          return 'month';
        default:
          return 'date';
      }
    },
    years() {
      const years = [];
      const maxYear = new Date().getFullYear() + 100;
      for (let i = 1970; i <= maxYear; i++) {
        years.push(i);
      }
      return years;
    },
  },
  watch: {
    datePickerIsVisible(val) {
      if (this.control.options.subtype === 'date-year') {
        if (val) {
          setTimeout(() => {
            this.$refs.picker.setActivePickerToYear();
          });
        }
      }
    },
  },
  methods: {
    getLabel() {
      return this.control.options.subtype === 'date-year' ? 'Year' : 'Date';
    },
    setToNull() {
      this.localValue = null;
      this.updateDatePicker(null);
    },
    handlePickerInput(ev) {
      console.log('picker', ev);
    },
    handleInput(ev) {
      console.log('text', ev);
    },
    handleBlurInput(ev) {
      console.log('text blur', ev);
    },
    handleChange() {
      console.log('handle change');
    },
    updateDate(date) {
      this.localValue = new Date(date).toISOString();
    },
    updateDatePicker(date) {
      this.localValue = date;
      if (date === null) {
        this.changed(null);
      } else {
        this.datePickerIsVisible = false;
        if (this.control.options.subtype === 'date') {
          this.changed(zonedTimeToUtc(date).toISOString());
        } else if (this.control.options.subtype === 'date-year') {
          const newDate = new Date(Date.UTC(date, 0, 1)); // set to first day of year
          this.changed(newDate.toISOString());
        } else if (this.control.options.subtype === 'date-week-month-year') {
          const newDate = new Date(date);
          let offset = -1;
          if (newDate.getTimezoneOffset() < 0) {
            offset = 0;
          }
          newDate.setDate(newDate.getDate() - newDate.getDay() + offset);
          this.changed(newDate.toISOString());
        }
      }
    },

    formatDate(date) {
      if (!date) return null;

      const [year, month, day] = date.split('-');
      switch (this.control.options.subtype) {
        case 'date-month-year':
          return `${month}/${year}`;
        case 'date-year':
          return `${year}`;
        default:
          return `${month}/${day}/${year}`;
      }
    },
  },
};
</script>
