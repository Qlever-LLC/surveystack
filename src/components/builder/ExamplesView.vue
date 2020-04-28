<template>
  <v-card
    style="height: 90vh"
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
          label="Select example and copy"
          v-model="selected"
          :items="files"
          single-line
          filled
        >
        </v-autocomplete>
        <v-btn
          outlined
          class="ma-2"
          dark
          color="white"
          text
          @click="close"
        >
          Close
        </v-btn>
      </v-row>
      <div style="width: 100%; height: 80vh;">
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

const reg = /.*\/(.*?)$/;

const req = require.context('!!raw-loader!@/examples/', true, /\.js$/);
const examples = req.keys().map(key => ({
  text: reg.exec(key)[1],
  path: key,
  value: key,
  content: req(key).default,
}));


export default {
  components: {
    appCodeView,
  },
  props: [
    'category',
  ],
  data() {
    return {
      selected: null,
    };
  },
  methods: {
    close() {
      this.$emit('close');
    },
  },
  computed: {
    code() {
      return examples.find(e => e.value === this.selected).content;
    },
    files() {
      return examples.filter(e => e.path.startsWith(`./${this.category}/`));
    },
  },
};
</script>
