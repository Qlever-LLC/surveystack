<template>
  <v-container fluid class="instructions date question">
    <v-row>
      <v-menu
        v-model="datePickerIsVisible"
        :close-on-content-click="false"
        transition="scale-transition"
        offset-y
        max-width="290px"
        min-width="290px"
      >
        <template v-slot:activator="{ on }">
          <v-text-field
            :value="dateFormatted"
            @input="datePickerIsVisible = false"
            @change="updateDateInput"
            label="Date"
            hint="MM/DD/YYYY format"
            persistent-hint
            prepend-icon="mdi-calendar"
            v-on="on"
          />
        </template>
        <v-date-picker
          :value="dateForPicker"
          @input="datePickerIsVisible = false"
          @change="updateDatePicker"
          :type="datePickerType"
          no-title
        />
      </v-menu>
    </v-row>
  </v-container>
</template>

<script>
import moment from 'moment';
import baseQuestionComponent from './BaseQuestionComponent';


export default {
  mixins: [baseQuestionComponent],
  data() {
    return {
      datePickerIsVisible: false,
    };
  },
  computed: {
    dateFormatted() {
      return this.value ? this.formatDate(moment(this.value).toISOString(true).substr(0, 10)) : null;
    },
    dateForPicker() {
      return moment().toISOString(true).substr(0, 10);
    },
    dateType() {
      return (this.control
        && this.control.options
        && this.control.options.subtype)
        || 'date';
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
  methods: {
    handlePickerInput(ev) {
      console.log('picker', ev);
    },
    handleInput(ev) {
      console.log('text', ev);
    },
    handleBlurInput(ev) {
      console.log('text blur', ev);
    },
    updateDate(date) {
      console.log(date);
      const newDate = moment(date).toISOString(true);
      this.dateFormatted = newDate;
    },
    updateDateInput(date) {
      console.log('input', date);
      const newDate = moment(date).toISOString(true);
      this.changed(newDate);
    },
    updateDatePicker(date) {
      console.log('picker', date);
      const newDate = moment(date).toISOString(true);
      this.changed(newDate);
    },
    formatDate(date) {
      if (!date) return null;

      const [year, month, day] = date.split('-');
      if (this.control.options.subtype === 'date-month-year') {
        return `${month}/${year}`;
      }
      return `${month}/${day}/${year}`;
    },
  },
};
</script>

<style>

</style>
