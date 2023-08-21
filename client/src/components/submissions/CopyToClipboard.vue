<template>
  <v-btn @click.stop="copyText" icon class="button">
    <a-icon>mdi-content-copy</a-icon>
  </v-btn>
</template>

<script>
import AIcon from '@/components/ui/AIcon.vue';

export default {
  components: { AIcon },
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
