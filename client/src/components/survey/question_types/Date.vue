<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize.enabled"
      @initialize="initialize"
    />
    <app-control-hint :value="control.hint" />
    <v-row>
      <div :class="{ 'mx-auto': centered }">
        <v-date-picker
          v-if="control.options.subtype !== 'date-year'"
          :value="dateForPicker"
          @input="updateDatePicker"
          :type="datePickerType"
          reactive
          no-title
          :range="control.options.subtype === 'date-week-month-year'"
          class="mt-5"
          color="focus"
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
              color="focus"
            />
          </template>
          <v-date-picker
            :value="dateForPicker"
            @input="updateDatePicker"
            :type="datePickerType"
            ref="picker"
            reactive
            no-title
            color="focus"
          />
        </v-menu>
      </div>
    </v-row>

    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],
  props: { centered: { type: Boolean, default: true } },
  data() {
    return {
      datePickerIsVisible: false,
    };
  },
  computed: {
    dateFormatted() {
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
    },
    dateType() {
      return (this.control && this.control.options && this.control.options.subtype) || 'date';
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
      const newDate = new Date(date).toISOString();
      this.dateFormatted = newDate;
    },
    updateDateInput(date) {
      const newDate = new Date(date).toISOString();
      this.changed(newDate);
    },
    updateDatePicker(date) {
      this.datePickerIsVisible = false;
      console.log('update date picker', date);

      const newDate =
        this.control.options.subtype === 'date-year'
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
