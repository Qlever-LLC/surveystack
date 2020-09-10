<template>
  <div>
    <v-container class="grey lighten-5">
      <v-row>
        <v-col
          cols="12"
          md="8"
        >
          Image(s):
          <v-card
            outlined
            tile
            v-if="control.options.source && control.options.source.images"
          >
            {{ control.options.source.images }}
          </v-card>
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          Markdown instructions
          <v-card
            outlined
            tile
            v-if="control.options.source && control.options.source.body"
          >
            {{ control.options.source.body }}
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import MarkdownIt from 'markdown-it';
import baseQuestionComponent from './BaseQuestionComponent';

const md = new MarkdownIt();

export default {
  mixins: [baseQuestionComponent],
  computed: {
    renderedBody() {
      return this.control
        && this.control.options
        && this.control.options.source
        && this.control.options.source.body
        && md.render(this.control.options.source.body);
    },
  },
};
</script>

<style>

</style>
