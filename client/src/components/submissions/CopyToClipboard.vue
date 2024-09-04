<template>
  <a-btn @click.stop="copyText" icon class="button">
    <a-icon>mdi-content-copy</a-icon>
  </a-btn>
</template>

<script>
import copyTextToClipboard from '@/utils/copyToClipboard';
export default {
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  methods: {
    copyText() {
      copyTextToClipboard(this.value);
    },
  },
};
</script>
<style scoped lang="scss">
.button {
  display: inline-block;
  margin: -5px 0;
}
</style>
