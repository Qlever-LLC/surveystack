<template>
  <div class="instructions-image-split question">
      <!-- class="grey lighten-5" -->
    <!-- <v-container
    >
      <v-row>
        <v-col
          cols="12"
          md="8"
        >
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
        </v-col>
      </v-row>
    </v-container> -->
    <div class="container">

      <div class="left">
        <!-- Image(s): -->
          <!-- tile -->
        <div
          outlined
          v-if="control.options.source && control.options.source.images"
        >
          <!-- {{ control.options.source.images[0] }} -->
          <div
            v-if="image && image.content"
          >
            <img
              :src="image.content"
              :alt="image.label"
            />
            <p>
            {{ image.label }}
            </p>

          </div>
        </div>
      </div>

      <div class="right">
        <!-- Markdown instructions -->
          <!-- outlined
          tile -->
        <div
          v-if="control.options.source && control.options.source.body"
          v-html="renderedBody"
        >
          <!-- {{ control.options.source.body }} -->
        </div>
      </div>
    </div>

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
    image() {
      return this.control
        && this.control.options
        && this.control.options.source
        && this.control.options.source.images
        && this.resources.find(({ id }) => id === this.control.options.source.images[0]);
    },
  },
};
</script>

<style scoped>
.instructions-image-split .container {
  display: block;
}

.left {
  flex-basis: 66%;
}

.right {
  flex-basis: 33%;
}

@media (min-width: 768px) {
  .instructions-image-split .container {
    display: flex;
  }

}
</style>
