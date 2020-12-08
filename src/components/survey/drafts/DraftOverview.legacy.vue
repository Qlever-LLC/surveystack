<template>
  <v-container>
    <v-card>
      <v-card-title>{{ survey.name }}</v-card-title>
      <v-card-subtitle>
        {{ submission._id }}
        <br />
        Submitting to: <kbd>{{ group }}</kbd>
        <br />
        Created: <kbd>{{ created }}</kbd>
        <br>
        Last modified: <kbd>{{ modified }}</kbd>
        <br />
        <strong v-if="submission.meta.dateSubmitted"><kbd>{{ submitted }}</kbd> submitted</strong>
      </v-card-subtitle>
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
          :hide-dot="display.hidden"
        >
          <v-card
            v-if="display.relevant || !display.hidden"
            @click="$emit('navigate', display.position);"
            :color="display.background"
            :dark="display.dark"
          >
            <div class="d-flex flex-row">
              <div
                v-if="display.active"
                style="width: 1rem;"
                class="green"
              > </div>

              <div class="flex-grow-1">
                <v-card-title class="d-block">
                  <div class="ma-0 pa-0 d-flex align-stretch">
                    <!-- color="#FF5722" -->
                    <v-chip
                      dark
                      small
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
                <v-card-text
                  class="py-0"
                  v-if="display.value"
                ><kbd class="pa-2">{{ display.value }}</kbd></v-card-text>
                <v-card-text v-else>No answer</v-card-text>
                <div
                  v-if="display.modified"
                  class="d-flex flex-row text--secondary pa-2"
                  style="font-size: 0.8rem"
                >
                  <div class="flex-grow-1">
                    {{ display.modified.format('YYYY-MM-DD HH:mm') }}<v-spacer></v-spacer>
                  </div>
                  <div class="text-right">
                    {{ display.modifiedHumanized }} ago
                  </div>
                </div>
              </div>
            </div>
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
import moment from 'moment';
import colors from 'vuetify/lib/util/colors';
import { linearControls } from '@/utils/submissions';
import * as utils from '@/utils/surveys';


const states = {
  done: ['mdi-check-bold', 'green'],
  missing: ['mdi-alert-decagram', 'orange'],
  error: ['mdi-alert-decagram', 'red'],
  warning: ['mdi-clipboard-alert-outline', 'red'],
  ok: ['', ''],
};

function iconify(control, relevant) {
  if (control.value != null) {
    return states.done;
  } if (relevant && (control.value == null && control.options.required)) {
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
    'group',
  ],
  data() {
    return {
      controlDisplays: [],
      modified: '',
      created: '',
      submitted: '',
    };
  },
  methods: {
    relevant(item, positions) {
      const idx = positions.findIndex(p => _.isEqual(p, item.position));
      if (idx === -1) {
        return true;
      }

      const relevant = utils.isRelevant(this.submission, this.survey, idx, positions);
      return relevant === undefined ? true : relevant;
    },
    expand(group) {
      this.controlDisplays.filter(item => item.collateGroup === group && item.collate > 0).forEach((item) => {
        // eslint-disable-next-line no-param-reassign
        item.collate = 1;
        // eslint-disable-next-line no-param-reassign
        item.hidden = false;
      });
    },
    refresh() {
      this.created = moment(this.submission.meta.dateCreated).format('YYYY-MM-DD HH:mm');
      this.modified = moment(this.submission.meta.dateModified).format('YYYY-MM-DD HH:mm');
      this.submitted = moment(this.submission.meta.dateSubmitted).format('YYYY-MM-DD HH:mm');

      const now = moment();
      const positions = utils.getSurveyPositions(this.survey, this.submission.meta.survey.version);

      let collate = 0;
      let collateGroup = 0;
      const controls = linearControls(this.survey, this.submission);

      const r = controls.map((item, itemIndex) => {
        const peek = itemIndex + 1 < controls.length ? controls[itemIndex + 1] : null;
        const active = _.isEqual(item.position, this.position);
        const rel = this.relevant(item, positions);
        let lastOfCollation = false;
        const icon = iconify(item, rel);

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

        const modified = item.meta.dateModified ? moment(item.meta.dateModified) : null;

        const background = 'white';

        return {
          label: item.label,
          value: item.value,
          breadcrumbs: item.breadcrumbs,
          icon: icon[0],
          color: icon[1],
          number: item.number.join('.'),
          background,
          position: item.position,
          dark: false,
          relevant: rel,
          hidden: !rel,
          collate,
          collateGroup,
          lastOfCollation,
          active,
          modified,
          modifiedHumanized: moment.duration(now.diff(modified)).humanize(),
        };
      });
      this.controlDisplays = r;
    },
  },
  watch: {
    /*
    submission: {
      handler() {
        this.refresh();
      },
      deep: true,
    },
    */
  },
};
</script>

<style scoped>
.number-chip {
  display: inline-flex;
  box-shadow: 0 0 1px 0px white inset, 0 0 1px 0px white;
  /* border: 1px solid red; */
  border: 1px solid currentColor;
  background-color: white;
  /* color: #ff5722; */
  border-radius: 1rem;
  line-height: 1rem;
  font-weight: bold;
  font-size: 80%;
  padding: 0.2rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
}
</style>
