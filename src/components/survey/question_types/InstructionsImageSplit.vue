<template>
  <div class="instructions-image-split question">
      <!-- class="grey lighten-5" -->
    <v-container
    >
      <v-row>
        <v-col
          cols="12"
          md="8"
        >
          <div
            outlined
            v-if="control.options.source && control.options.source.images"
          >
            {{ control.options.source.images[0] }}
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
        </v-col>

        <v-col
          cols="12"
          md="4"
        >
          <div
            v-if="control.options.source && control.options.source.body"
            v-html="renderedBody"
          />
        </v-col>
      </v-row>
    </v-container>
    <!-- <div class="container">

      <div class="left">
        <div
          outlined
          v-if="control.options.source && control.options.source.images"
        >
          {{ control.options.source.images[0] }}
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
        <div
          v-if="control.options.source && control.options.source.body"
          v-html="renderedBody"
        />
      </div>
    </div> -->

  </div>
</template>

<script>
import MarkdownIt from 'markdown-it';

import markdownItContainer from 'markdown-it-container';
import baseQuestionComponent from './BaseQuestionComponent';

const md = new MarkdownIt();


md.use(markdownItContainer, 'spoiler', {
  validate(params) {
    return params.trim().match(/^spoiler\s+(.*)$/);
  },
  render(tokens, idx) {
    const m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);

    if (tokens[idx].nesting === 1) {
      // opening tag
      return `<details><summary>${md.utils.escapeHtml(m[1])}</summary>\n`;
    }
    // closing tag
    return '</details>\n';
  },
});

// function createBasicMarkdownContainer(name, additionalClasses) {
//   return {
//     validate(params) {
//       // return params.trim().match(/^error\s+(.*)$/);
//       return params.trim().match(/^error\s+(.*)$/);
//     },
//     render(tokens, idx) {
//       if (tokens[idx].nesting === 1) {
//       // opening tag
//         return '<div class="error">\n';
//       }
//       // closing tag
//       return '</div>\n';
//     },
//   };
// }

// md.use(markdownItContainer, 'error', {
//   validate(params) {
//     return params.trim().match(/^error\s+(.*)$/);
//   },
//   render(tokens, idx) {
//     if (tokens[idx].nesting === 1) {
//       // opening tag
//       return '<div class="error">\n';
//     }
//     // closing tag
//     return '</div>\n';
//   },
// });

// md.use(markdownItContainer, 'warning', {
//   validate(params) {
//     return params.trim().match(/^warning\s+(.*)$/);
//   },
//   render(tokens, idx) {
//     if (tokens[idx].nesting === 1) {
//       // opening tag
//       return '<div class="warning">\n';
//     }
//     // closing tag
//     return '</div>\n';
//   },
// });

// md.use(markdownItContainer, 'info', {
//   validate(params) {
//     return params.trim().match(/^info\s+(.*)$/);
//   },
//   render(tokens, idx) {
//     if (tokens[idx].nesting === 1) {
//       // opening tag
//       return '<div class="info">\n';
//     }
//     // closing tag
//     return '</div>\n';
//   },
// });

md.use(markdownItContainer, 'error');
md.use(markdownItContainer, 'warning');
md.use(markdownItContainer, 'success');
md.use(markdownItContainer, 'info');

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

<style>
.instructions-image-split .info {
  background-color: #ffdd37;
}

.instructions-image-split .error {
  background-color: #ff614e;
}

.instructions-image-split .success {
  background-color: #a7df65;
}

.instructions-image-split .warning {
  background-color: #9dcab7;
}

.instructions-image-split .info,
.instructions-image-split .error,
.instructions-image-split .success,
.instructions-image-split .warning {
  padding: 0.5rem;
  margin: 0.5rem;
  border-radius: 3px;
}


</style>

<style scoped>
.info, .error, .success, .warning {
  padding: 5px;
}
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
