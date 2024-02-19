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
        <a-date-year
          v-if="control.options.subtype === 'date-year'"
          :label="getLabel()"
          :modelValue="modelValue"
          @update:modelValue="updateDatePicker"
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
              :label="getLabel()"
              :modelValue="dateFormatted"
              clearable
              color="focus"
              persistent-hint
              prepend-inner-icon="mdi-calendar"
              readonly
              style="min-width: 290px"
              v-bind="props"
              variant="outlined"
              @change="updateDate"
              @click:clear="setToNull"
              @update:modelValue="datePickerIsVisible = false" />
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
      localValue: this.modelValue,
    };
  },
  computed: {
    dateFormatted() {
      return this.localValue ? this.formatDate(new Date(this.modelValue).toISOString().substring(0, 10)) : null;
    },
    dateForPicker() {
      if (this.control.options.subtype === 'date-week-month-year') {
        if (this.modelValue) {
          const date = new Date(this.modelValue);
          return [date, new Date(date.setDate(date.getDate() + 6))];
        } else {
          return [];
        }
      } else {
        if (this.modelValue) {
          return new Date(this.modelValue);
        } else {
          return null;
        }
      }
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
      if (date === null) {
        this.changed(null);
      } else {
        this.datePickerIsVisible = false;
        if (this.control.options.subtype === 'date' || !this.control.options.subtype) {
          this.changed(zonedTimeToUtc(date).toISOString());
        } else if (this.control.options.subtype === 'date-year') {
          this.changed(date);
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
