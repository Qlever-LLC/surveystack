<template>
  <v-container>
    <v-card>
      <v-card-title>{{ survey.name }}</v-card-title>
      <v-card-subtitle> {{ submission._id }}</v-card-subtitle>
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
          <v-card
            @click="$emit('navigate', display.position);"
            :color="display.background"
            :dark="display.active"
          >
            <v-card-title class="d-block">
              <div class="ma-0 pa-0">
                <v-chip
                  dark
                  small
                  color="red"
                  class="mr-0 mr-1"
                ><span
                    v-for="(crumb, ci) in display.breadcrumbs"
                    :key="`bread_${ci}`"
                  >{{ crumb }} <span
                      class="mr-1"
                      v-if="ci < display.breadcrumbs.length - 1"
                    >&gt;</span></span></v-chip>
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

import _ from 'lodash';
import colors from 'vuetify/lib/util/colors';
import appMixin from '@/components/mixin/appComponent.mixin';
import { linearControls } from '@/utils/surveys';

const states = {
  done: ['mdi-check-bold', 'green'],
  missing: ['mdi-clipboard-arrow-right', 'orange'],
  error: ['mdi-exclamation-thick', 'red'],
  warning: ['mdi-clipboard-alert-outline', 'red'],
  ok: ['', ''],
};

function iconify(control) {
  if (control.value != null) {
    return states.done;
  } if (control.value == null && control.required) {
    return states.missing;
  } if (control.warning) {
    return states.warning;
  } if (control.error) {
    return states.error;
  }
  return states.ok;
}

export default {
  props: [
    'survey',
    'submission',
    'position',
  ],
  computed: {
    flatSubmission() {
      return linearControls(this.submission);
    },
    controlDisplays() {
      const r = linearControls(this.submission).map((control) => {
        const icon = iconify(control);
        const active = _.isEqual(control.position, this.position);
        return {
          label: control.label,
          value: control.value,
          breadcrumbs: control.breadcrumbs,
          icon: icon[0],
          color: icon[1],
          number: control.number.join('.'),
          background: active ? colors.green.base : 'white',
          position: control.position,
          active,
        };
      });
      return r;
    },
  },
};
</script>

<style scoped>
.number-chip {
  display: inline-flex;
  box-shadow: 0 0 1px 0px white inset, 0 0 1px 0px white;
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
