<template>
  <v-container style="min-height: 600px">
    <div class="d-flex justify-end">
      <v-btn
        class="my-2"
        @click="$store.dispatch('draft/showOverview', false)"
      >
        <v-icon left>mdi-close</v-icon>Close
      </v-btn>
    </div>
    <v-banner
      class="my-2"
      v-if="$store.getters['draft/errors']"
      color="red"
      dark
      rounded
    >
      <h3>Api Compose Errors</h3>
      <li
        v-for="(error, i) in $store.getters['draft/errors']"
        :key="i"
      >
        <strong>{{error.path}}</strong> {{error.error.name}}: {{error.error.message}} <br />
      </li>
    </v-banner>
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
            @click="$emit('goto', display.path)"
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
                    >{{display.path}}</v-chip>
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
  } if (relevant && (value == null && control.options.required)) {
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
    'overviews',
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
    expand(group) {
      this.controlDisplays.filter(item => item.collateGroup === group && item.collate > 0).forEach((item) => {
        // eslint-disable-next-line no-param-reassign
        item.collate = 1;
        // eslint-disable-next-line no-param-reassign
        item.hidden = false;
      });
    },
    isRelevant(node) {
      const relevant = node.getPath().every((n) => {
        const p = n.getPath().map(nn => nn.model.name).join('.');
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
        const number = node.getPath().map(n => n.getIndex() + 1).slice(1).join('.');
        const value = this.$store.getters['draft/property'](`${overview.path}.value`);
        const icon = iconify(value, overview.control, relevant);

        controlDisplays.push({
          path: overview.path,
          label: overview.control.label,
          value,
          icon: icon[0],
          color: icon[1],
          number,
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
</style>
