<template>
  <v-container class="wrapper ml-0">
    <v-banner class="my-2" v-if="$store.getters['draft/errors']" color="red" dark rounded>
      <h3>Api Compose Errors</h3>
      <li v-for="(error, i) in $store.getters['draft/errors']" :key="i">
        <strong>{{ error.path }}</strong> {{ error.error.name }}: {{ error.error.message }} <br />
      </li>
    </v-banner>
    <v-card>
      <v-card-title>{{ survey.name }}</v-card-title>
      <v-card-subtitle class="grey--text mt-n5">
        {{ submission._id }}
        <br />

        <strong v-if="submission.meta.dateSubmitted"
          ><kbd>{{ submitted }}</kbd> submitted</strong
        >
      </v-card-subtitle>
      <v-card-text>
        Submitting to: {{ groupPath || '--' }}
        <br />
        Created: {{ created }}
        <br />
        Last modified: {{ modified }}
        <br />
      </v-card-text>
    </v-card>
    <v-timeline v-if="controlDisplays" dense class="width: 100%">
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
            @click="$emit('goto', display.path)"
            :color="display.background"
            :dark="display.dark"
            :style="{
              opacity: display.relevant ? 1.0 : 0.5,
              'border-left': display.active ? '4px solid green !important' : '',
            }"
            class="pb-1"
          >
            <!-- title -->
            <v-card-title class="d-block mb-0 pb-0">
              <div class="d-flex flex-row align-baseline">
                <span
                  class="grey--text text--darken-1 mr-1 text-no-wrap"
                  style="font-weight: initial; font-size: initial"
                  >{{ display.questionNumber }}</span
                >
                <app-control-label
                  class="ml-2 mb-0 flex-grow-1"
                  :value="display.label"
                  :redacted="display.redacted"
                  :required="display.required"
                />
              </div>
            </v-card-title>

            <!-- path (not shown) -->
            <v-card-text v-if="false" class="my-0 py-0">
              <span
                class="font-weight-light grey--text text--darken-2 mt-n1"
                style="font-size: 0.9rem; position: relative;"
                >{{ display.path }}</span
              >
            </v-card-text>

            <!-- value -->
            <v-card-text v-if="display.value && display.ellipsis" class="pb-7">
              <div
                class="d-flex"
                style="max-width: 99%; position: absolute"
                @click.stop="display.ellipsis = !display.ellipsis"
              >
                <div class="overview-value overview-value-ellipsis">
                  {{ display.value }}
                </div>
              </div>
            </v-card-text>

            <v-card-text v-else-if="display.value && !display.ellipsis" style="padding-bottom: 2px">
              <div class="d-flex" @click.stop="display.ellipsis = !display.ellipsis">
                <div class="overview-value">{{ display.value }}</div>
              </div>
            </v-card-text>

            <v-card-text v-else>
              No answer
            </v-card-text>

            <!-- date modified -->
            <v-card-text class="pt-1 pb-0" v-if="display.modified">
              <div class="d-flex justify-space-between text--secondary" style="font-size: 0.8rem">
                <div>
                  {{ display.modified.format('YYYY-MM-DD HH:mm') }}
                </div>
                <div>{{ display.modifiedHumanized }} ago</div>
              </div>
            </v-card-text>
          </v-card>

          <v-chip v-else @click="expand(display.collateGroup)" dark small color="grey" class="mr-0 mr-1"
            >{{ display.collate }} Irrelevant Questions</v-chip
          >
        </v-timeline-item>
      </template>
    </v-timeline>
  </v-container>
</template>

<script>
import moment from 'moment';

const states = {
  done: ['mdi-check-bold', 'green'],
  missing: ['mdi-alert-decagram', 'orange'],
  error: ['mdi-alert-decagram', 'red'],
  warning: ['mdi-clipboard-alert-outline', 'red'],
  ok: ['', ''],
};

function iconify(value, control, relevant) {
  if (value != null) {
    return states.done;
  }
  if (relevant && value == null && control.options.required) {
    return states.missing;
  }
  if (control.warning) {
    return states.warning;
  }
  if (control.error) {
    return states.error;
  }
  return states.ok;
}

export default {
  props: ['survey', 'submission', 'groupPath', 'overviews'],
  data() {
    return {
      controlDisplays: [],
      modified: '',
      created: '',
      submitted: '',
    };
  },
  methods: {
    expand(group) {
      this.controlDisplays
        .filter((item) => item.collateGroup === group && item.collate > 0)
        .forEach((item) => {
          // eslint-disable-next-line no-param-reassign
          item.collate = 1;
          // eslint-disable-next-line no-param-reassign
          item.hidden = false;
        });
    },
    isRelevant(node) {
      const relevant = node.getPath().every((n) => {
        const p = n
          .getPath()
          .map((nn) => nn.model.name)
          .join('.');
        const r = this.$store.getters['draft/property'](`${p}.meta.relevant`, true);
        return r;
      });
      return relevant;
    },
    refresh() {
      this.created = moment(this.submission.meta.dateCreated).format('YYYY-MM-DD HH:mm');
      this.modified = moment(this.submission.meta.dateModified).format('YYYY-MM-DD HH:mm');
      this.submitted = moment(this.submission.meta.dateSubmitted).format('YYYY-MM-DD HH:mm');

      const now = moment();

      let collate = 0;
      let collateGroup = 0;

      const controlDisplays = [];

      for (let i = 0; i < this.overviews.length; i++) {
        const overview = this.overviews[i];
        const nextOverview = i + 1 < this.overviews.length ? this.overviews[i + 1] : null;

        const { node, path, control } = overview;
        if (control.type === 'group' || control.type === 'page') {
          continue; // eslint-disable-line no-continue
        }

        const relevant = this.isRelevant(node);

        let lastOfCollation = false;

        if (!relevant) {
          collate++;
          // end collation if there are no next nodes or next nodes are relevant again
          if (!nextOverview || (nextOverview && this.isRelevant(nextOverview.node))) {
            lastOfCollation = true;
          }
        } else {
          collate = 0;
          collateGroup++;
        }

        const dateModified = this.$store.getters['draft/property'](`${path}.meta.dateModified`, null);
        const modified = dateModified ? moment(dateModified) : null;

        const active = this.$store.getters['draft/path'] === overview.path;
        const background = 'white';
        const questionNumber = node
          .getPath()
          .map((n) => n.getIndex() + 1)
          .slice(1)
          .join('.');
        const value = this.$store.getters['draft/property'](`${overview.path}.value`);
        const icon = iconify(value, overview.control, relevant);

        controlDisplays.push({
          path: overview.path,
          label: overview.control.label || overview.control.hint || overview.control.type,
          value,
          icon: icon[0],
          color: icon[1],
          questionNumber,
          background,
          dark: false,
          relevant,
          hidden: !relevant,
          collate,
          collateGroup,
          lastOfCollation,
          active,
          modified,
          modifiedHumanized: moment.duration(now.diff(modified)).humanize(),
          redacted: overview.control.options && overview.control.options.redacted,
          required: overview.control.options && overview.control.options.required,
          ellipsis: true,
        });
      }

      this.controlDisplays = controlDisplays;
    },
  },
  mounted() {
    this.refresh();
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

.overview-value {
  color: white;
  font-family: monospace;
  font-size: 11.9px;
  line-height: 22px;
  letter-spacing: 0.1px;
  text-rendering: optimizeLegibility;
  font-weight: 900;
  background: #555;
  padding: 2px 4px;
}

.overview-value-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 32px;
}
</style>
