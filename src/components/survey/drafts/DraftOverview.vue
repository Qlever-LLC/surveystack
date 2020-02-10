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
          v-if="display.collate === 0 || display.lastOfCollation || !display.hidden"
          :key="idx"
          :icon="display.icon"
          :color="display.color"
        >
          <v-card
            v-if="display.relevant || !display.hidden"
            @click="$emit('navigate', display.position);"
            :color="display.background"
            :dark="display.dark"
          >
            <v-card-title class="d-block">
              <div class="ma-0 pa-0 d-flex">
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
                <v-spacer></v-spacer>
                <v-chip
                  small
                  dark
                  v-if="display.collate > 0"
                  color="grey-darken-5"
                >Irrelevant</v-chip>
              </div>
              <span class="number-chip mr-2">{{ display.number }}</span>
              {{ display.label }}
            </v-card-title>
            <v-card-text v-if="display.value"><kbd class="pa-2">{{ display.value }}</kbd></v-card-text>
            <v-card-text v-else>No answer</v-card-text>
          </v-card>

          <v-chip
            v-else
            @click="expand(display.collateGroup)"
            dark
            small
            color="grey"
            class="mr-0 mr-1"
          >{{ display.collate }} Irrelevant Questions</v-chip>
        </v-timeline-item>
      </template>
    </v-timeline>
  </v-container>
</template>

<script>
import _ from 'lodash';
import colors from 'vuetify/lib/util/colors';
import appMixin from '@/components/mixin/appComponent.mixin';
import { linearControls } from '@/utils/submissions';
import * as utils from '@/utils/surveys';


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
  data() {
    return {
      controlDisplays: [],
    };
  },
  methods: {
    relevant(item, positions) {
      const idx = positions.findIndex(p => _.isEqual(p, item.position));
      const relevant = utils.isRelevant(this.submission, this.survey, idx, positions);
      return relevant === undefined ? true : relevant;
    },
    expand(group) {
      this.controlDisplays.filter(item => item.collateGroup === group).forEach((item) => {
        // eslint-disable-next-line no-param-reassign
        item.collate = 1;
        // eslint-disable-next-line no-param-reassign
        item.hidden = false;
      });
    },
    refresh() {
      const positions = utils.getSurveyPositions(this.survey, this.submission.version);

      let collate = 0;
      let collateGroup = 0;
      const controls = linearControls(this.survey, this.submission);

      const r = controls.map((item, itemIndex) => {
        const peek = itemIndex + 1 < controls.length ? controls[itemIndex + 1] : null;
        const icon = iconify(item);
        const active = _.isEqual(item.position, this.position);
        const rel = this.relevant(item, positions);
        let lastOfCollation = false;

        if (!rel) {
          collate++;
          if (peek) {
            if (this.relevant(peek, positions)) {
              lastOfCollation = true;
            }
          } else {
            lastOfCollation = true;
          }
        } else {
          collate = 0;
          collateGroup++;
        }

        const background = (active ? colors.green.base : 'white');

        return {
          label: item.label,
          value: item.value,
          breadcrumbs: item.breadcrumbs,
          icon: icon[0],
          color: icon[1],
          number: item.number.join('.'),
          background,
          position: item.position,
          dark: active,
          relevant: rel,
          hidden: !rel,
          collate,
          collateGroup,
          lastOfCollation,
        };
      });
      this.controlDisplays = r;
    },
  },
  watch: {
    submission: {
      handler() {
        this.refresh();
      },
      deep: true,
    },
    survey: {
      handler() {
        this.refresh();
      },
      deep: true,
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
