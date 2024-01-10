<template>
  <div class="instructions-image-split question">
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <app-control-hint :value="control.hint" />
    <div class="wrapper full-width">
      <div class="left">
        <div outlined v-if="control.options.source && control.options.source.images">
          <div v-if="image && image.content">
            <img
              :src="image.content"
              :alt="image.label"
              class="full-width"
              style="max-height: 80vh; object-fit: contain" />
          </div>
        </div>
      </div>

      <div class="right">
        <div v-if="control.options.source && control.options.source.body" v-html="renderedBody" class="md" />
      </div>
    </div>

    <app-control-more-info :value="control.moreInfo" />
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

md.use(markdownItContainer, 'error');
md.use(markdownItContainer, 'warning');
md.use(markdownItContainer, 'success');
md.use(markdownItContainer, 'info');

export default {
  mixins: [baseQuestionComponent],
  computed: {
    renderedBody() {
      return (
        this.control &&
        this.control.options &&
        this.control.options.source &&
        this.control.options.source.body &&
        md.render(this.control.options.source.body)
      );
    },
    image() {
      return (
        this.control &&
        this.control.options &&
        this.control.options.source &&
        this.control.options.source.images &&
        this.resources.find(({ id }) => id === this.control.options.source.images[0])
      );
    },
  },
};
</script>

<style>
.md ul,
.md ol {
  margin: 1rem 0;
}

/* .md li {
  margin-left:
} */

.md pre {
  margin: 1rem 0;
  background-color: #f0f0f0;
  padding: 1rem 0.5rem;
  border-radius: 4px;
}

.md code {
  background-color: #f0f0f0;
  color: unset;
  padding: 2px 4px;
  font-weight: unset;
  font-size: unset;
}

.md blockquote {
  padding: 1rem;
  background-color: #eee;
  border-radius: 3px;
  border-left: 5px solid #bbb;
  margin: 1rem 0;
  color: #444;
}

.md .info {
  background-color: #9dcab7;
}

.md .error {
  background-color: #ff614e;
}

.md .success {
  background-color: #a7df65;
}

.md .warning {
  background-color: #ffdd37;
}

.md .info,
.md .error,
.md .success,
.md .warning {
  padding: 0.5rem;
  margin: 1rem 0;
  border-radius: 3px;
}

.md blockquote p,
.md .info p,
.md .error p,
.md .success p,
.md .warning p {
  margin-bottom: 0;
}

.md blockquote p + p,
.md .info p + p,
.md .error p + p,
.md .success p + p,
.md .warning p + p {
  margin-bottom: 1rem;
}

.md table:not(.code) {
  margin: 1rem 0;
  border-collapse: collapse;
}

.md table:not(.code) th,
.md table:not(.code) td {
  border: 1px solid #dbdbdb;
}

.md table:not(.code) tr th {
  border-bottom: solid 2px #bfbfbf;
  background-color: #f0f0f0;
  padding: 0.5rem 1rem;
  vertical-align: middle;
}

.md table:not(.code) tbody td {
  border-color: #dbdbdb;
  padding: 0.5rem 1rem;
  vertical-align: middle;
}

.draft.builder-draft .instructions-image-split .wrapper {
  display: block;
}
</style>

<style scoped lang="scss">
.instructions-image-split .wrapper {
  display: block;
}

.left {
  /* flex-basis: 65%; */

  /* margin-right: 3%; */
  margin-right: 3%;
  flex-basis: 60%;
  flex-grow: 1;
}

.right {
  /* flex-basis: 32%; */
  flex-basis: 40%;
  flex-shrink: 1;
}

@media (min-width: 768px) {
  .instructions-image-split .wrapper {
    display: flex;
  }
}
</style>
