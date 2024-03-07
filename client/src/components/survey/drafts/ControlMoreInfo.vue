<template>
  <div v-if="value" class="preview" v-html="getHtml"></div>
</template>

<script>
import MarkdownIt from 'markdown-it';
const md = new MarkdownIt({ linkify: true });

export default {
  props: ['value'],
  computed: {
    getHtml() {
      return md.render(this.value);
    },
  },
};
</script>

<style scoped lang="scss">
.preview {
  color: rgba(0, 0, 0, 0.6);
  margin-top: 12px;
}

.preview >>> img {
  max-width: 100%;
}
</style>
