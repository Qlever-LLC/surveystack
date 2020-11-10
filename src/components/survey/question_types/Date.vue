<template>
  <v-container
    fluid
    class="instructions date question"
  >
    <v-row>
      <div class="d-block mx-auto">
        <p
          v-if="control.title"
          class="mb-4"
        >{{control.title}}</p>

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
          :range="this.control.options.subtype === 'date-week-month-year'"
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
        <p
          v-if="control.hint"
          class="mt-6"
        >{{control.hint}}</p>
      </div>
    </v-row>
  </v-container>
</template>

<script>
// import moment from 'moment';
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
      // return this.value ? this.formatDate(moment(this.value).toISOString(true).substring(0, 10)) : null;
      return this.value ? this.formatDate(new Date(this.value).toISOString().substring(0, 10)) : null;
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
        return new Date(this.value).toISOString().substring(0, substrLength);
      }

      return null;
      // return this.value
      //   // ? moment(this.value).toISOString(true).substring(0, substrLength)
      //   ? new Date(this.value).toISOString().substring(0, substrLength)
      //   : null;
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
      // console.log(date);
      // const newDate = moment(date).toISOString(true);
      const newDate = new Date(date).toISOString();
      this.dateFormatted = newDate;
    },
    updateDateInput(date) {
      // console.log('input', date);
      // const newDate = moment(date).toISOString(true);
      const newDate = new Date(date).toISOString();
      this.changed(newDate);
    },
    updateDatePicker(date) {
      this.datePickerIsVisible = false;
      console.log('update date picker', date);
      // const newDate = moment(date);

      const newDate = this.control.options.subtype === 'date-year'
        ? new Date(date.replace(/^(\d{4})-(\d{2})-(\d{2})/, (match, g1) => [g1, '01', '01'].join('-'))) // set month and date to 1
        : new Date(date);
      console.log('new Date', newDate, newDate.toISOString());
      if (this.control.options.subtype === 'date-year') {
        this.$refs.picker.activePicker = 'YEAR';
      } else if (this.control.options.subtype === 'date-week-month-year') {
        // const offset = newDate.getDay() === 0 ? -1 : 0;
        const offset = -1;
        console.log(newDate.toISOString().substring(0, 10), newDate.getDay(), offset);
        newDate.setDate(newDate.getDate() - newDate.getDay() + offset);
        // newDate.setDate(newDate.getDate() - newDate.getDay() - 1);
      }
      // this.changed(newDate.toISOString(true));
      console.log(newDate, 'as iso', newDate.toISOString());
      this.changed(newDate.toISOString());
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
