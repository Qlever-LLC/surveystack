<template>
  <div v-if="value" class="control-more-info" v-html="getHtml"></div>
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
.control-more-info {
  color: rgba(0, 0, 0, 0.6);
  margin-top: 12px;
}

.control-more-info >>> img {
  max-width: 100%;
}
</style>
