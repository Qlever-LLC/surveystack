<template>
  <v-container>
    <v-card>
      <v-card-title>Overview</v-card-title>
    </v-card>
    <v-timeline
      v-if="controlDisplays"
      dense
    >
      <template v-for="(display, idx) in controlDisplays">
        <v-timeline-item
          :key="idx"
          :icon="display.icon"
          :color="display.color"
        >
          <v-card>
            <v-card-title class="d-block">
              <div class="ma-0 pa-0">
                <v-chip
                  dark
                  small
                  color="red"
                  class="mr-0 mr-1"
                  v-for="(crumb, ci) in display.breadcrumbs"
                  :key="`bread_${ci}`"
                >{{ crumb }}</v-chip>
              </div>
              <span class="number-chip mr-2">{{ display.number }}</span> {{ display.label }}
            </v-card-title>
            <v-card-text v-if="display.value"><kbd class="pa-2">{{ display.value }}</kbd></v-card-text>
            <v-card-text v-else>No answer</v-card-text>
          </v-card>
        </v-timeline-item>
      </template>
    </v-timeline>
  </v-container>
</template>

<script>

import colors from 'vuetify/lib/util/colors';
import appMixin from '@/components/mixin/appCoomponent.mixin';
import { linearControls } from '@/utils/surveys';


function done(question) {
  return question.value !== null;
}

export default {
  props: [
    'survey',
    'submission',
  ],
  mixins: [appMixin],
  computed: {
    flatSubmission() {
      return linearControls(this.submission);
    },
    controlDisplays() {
      console.log('submission', this.submission);
      const r = linearControls(this.submission).map(control => ({
        label: control.label,
        value: control.value,
        breadcrumbs: control.breadcrumbs,
        icon: done(control) ? 'mdi-check-bold' : '',
        color: done(control) ? 'green' : '#fafafa',
        number: control.number.join('.'),
      }));
      console.log('controlDisplays', r);
      return r;
    },
  },
};
</script>

<style scoped>
.number-chip {
  display: inline-flex;
  border: 1px solid red;
  background-color: white;
  color: #ff5722;
  border-radius: 1rem;
  line-height: 1rem;
  font-weight: bold;
  font-size: 80%;
  padding: 0.2rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
}
</style>
