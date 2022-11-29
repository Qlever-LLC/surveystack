<template>
  <v-btn @click.stop="copyText" icon class="button">
    <v-icon>mdi-content-copy</v-icon>
  </v-btn>
</template>

<script>
export default {
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
