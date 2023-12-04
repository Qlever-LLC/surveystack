<template>
  <a-card cssHeight90vh color="grey darken-3">
    <a-container>
      <a-row>
        <a-spacer />
        <a-select
          engineering="autocomplete"
          style="max-width: 800px"
          rounded
          dark
          solo
          label="Select example and copy"
          v-model="selected"
          :items="files"
          single-line
          filled
        />
        <a-btn variant="text" class="ma-2" dark color="white" @click="close"> Close </a-btn>
      </a-row>
      <div style="width: 100%; height: 80vh">
        <app-code-view :raw="true" :value="code" v-if="selected !== null"> </app-code-view>
      </div>
    </a-container>
  </a-card>
</template>

<script>
import appCodeView from '@/components/builder/CodeView.vue';

const reg = /.*\/(.*?)$/;

const req = require.context('!!raw-loader!@/examples/', true, /\.js$/);
const examples = req.keys().map((key) => ({
  text: reg.exec(key)[1],
  path: key,
  value: key,
  content: req(key).default,
}));

export default {
  components: {
    appCodeView,
  },
  props: ['category'],
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
      return examples.find((e) => e.value === this.selected).content;
    },
    files() {
      return examples.filter((e) => e.path.startsWith(`./${this.category}/`));
    },
  },
};
</script>
