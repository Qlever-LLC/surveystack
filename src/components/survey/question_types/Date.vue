<template>
  <v-container fluid class="instructions date question">
    <v-row>
      <div class="d-block mx-auto">
        <div class="text-center mb-2">{{ this.control.label }}</div>
          <!-- @change="updateDatePicker" -->
          <!-- @input="updateDateInput" -->

        <v-date-picker
          v-if="control.options.subtype !== 'date-year'"
          :value="dateForPicker"
          @input="updateDatePicker"
          :type="datePickerType"
          reactive
          no-title
        />
        <!--
          use text field with menu for year picker because year picker's
          UI placeholder year is the same as when year is selected
         -->
        <v-menu
          v-else
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
              label="Year"
              persistent-hint
              prepend-icon="mdi-calendar"
              v-on="on"
              readonly
              outlined
            />
          </template>
          <v-date-picker
            :value="dateForPicker"
            @input="updateDatePicker"
            :type="datePickerType"
            ref="picker"
            reactive
            no-title
          />
        </v-menu>
        <p class="mt-4">{{control.hint}}</p>
      </div>
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
      let substrLength;
      switch (this.control.options.subtype) {
        case 'date-month-year':
          substrLength = 7;
          break;
        default:
          substrLength = 10;
          break;
      }
      return this.value
        ? moment(this.value).toISOString(true).substr(0, substrLength)
        : null;
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
        // case 'date-year':
        //   return 'year';
        default:
          return 'date';
      }
    },
  },
  // mounted() {
  //   if (this.control.options.subtype === 'date-year') {
  //     setTimeout(() => {
  //       this.$refs.picker.activePicker = 'YEAR';
  //     });
  //   }
  // },
  watch: {
    datePickerIsVisible(val) {
      if (val) {
        setTimeout(() => {
          this.$refs.picker.activePicker = 'YEAR';
        });
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
    handleChange() {
      console.log('handle change');
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
      this.datePickerIsVisible = false;
      const newDate = moment(date);
      if (this.control.options.subtype === 'date-year') {
        this.$refs.picker.activePicker = 'YEAR';
        // Set day of month to 1, otherwise year picker will default to current day of month
        newDate.set('date', 1);
      }
      this.changed(newDate.toISOString(true));
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

<style>

</style>
