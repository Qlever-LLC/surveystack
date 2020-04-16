<template>
  <v-card
    style="height: 60vh"
    color="grey darken-3"
  >
    <v-container>
      <v-row dark>
        <v-spacer></v-spacer>
        <v-autocomplete
          style="max-width: 800px"
          rounded
          dark
          solo
          label="Example"
          v-model="selected"
          :items="examples"
          single-line
          filled
        >
        </v-autocomplete>
      </v-row>
      <div style="width: 100%; height: 60vh;">
        <app-code-view
          :raw="true"
          :value="code"
          v-if="selected !== null"
        >
        </app-code-view>
      </div>
    </v-container>
  </v-card>
</template>

<script>

import appCodeView from '@/components/builder/CodeView.vue';

const req = require.context('!!raw-loader!@/examples/', true, /\.js$/);
const examples = req.keys().map(key => ({
  text: key,
  value: key,
  content: req(key).default,
}));


export default {
  components: {
    appCodeView,
  },
  data() {
    return {
      selected: null,
      examples,
    };
  },
  computed: {
    code() {
      return this.examples.find(e => e.value === this.selected).content;
    },
  },
};
</script>
