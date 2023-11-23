<template>
  <a-btn @click.stop="copyText" icon class="button">
    <a-icon>mdi-content-copy</a-icon>
  </a-btn>
</template>

<script>
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  methods: {
    copyText() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(this.value).catch((err) => {
          console.error('Async: Could not copy text: ', err);
        });
      } else {
        console.warn("Can't copy to clipboard:", this.value);
      }
    },
  },
};
</script>
<style scoped>
.button {
  display: inline-block;
  margin: -5px 0;
}
</style>
