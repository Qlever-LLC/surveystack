<template>
  <v-btn @click.stop="copyText" icon class="button">
    <v-icon>mdi-content-copy</v-icon>
  </v-btn>
  <!-- <v-btn @click.stop="copyText" class="button">copy</v-btn> -->
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
      const tempInput = document.createElement('input');
      tempInput.value = this.value;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
    },
  },
};
</script>
<style scoped>
.button {
  display: inline-block;
  line-height: 0;
  margin: -5px 0;
}
</style>
