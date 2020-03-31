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
          no-title
        />
      </v-menu>
    </v-row>
  </v-container>
</template>

<script>
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
      return this.formatDate(new Date(this.value || Date.now()).toISOString().substr(0, 10));
    },
    dateForPicker() {
      return new Date(this.value || Date.now()).toISOString().substr(0, 10);
    },
    dateType() {
      return (this.control
        && this.control.options
        && this.control.options.subtype)
        || 'date';
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
      const newDate = new Date(date).toISOString();
      this.dateFormatted = newDate;
    },
    updateDateInput(date) {
      console.log('input', date);
      const newDate = new Date(date).toISOString();
      this.changed(newDate);
    },
    updateDatePicker(date) {
      console.log('picker', date);
      const newDate = new Date(date).toISOString();
      this.changed(newDate);
    },
    formatDate(date) {
      if (!date) return null;

      const [year, month, day] = date.split('-');
      return `${month}/${day}/${year}`;
    },
  },
};
</script>

<style>

</style>
