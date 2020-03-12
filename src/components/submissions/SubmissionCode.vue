<template>
  <div>
    <v-textarea
      class="ma-3"
      :value="valueString"
      rows="30"
      readonly
    />
  </div>
</template>
<script>
export default {
  props: {
    submissions: {
      type: Object,
      required: true,
    },
  },
  computed: {
    valueString() {
      return JSON.stringify(this.submissions.content, null, 2);
    },
  },

};
</script>
<style scoped>
pre {
  text-align: start;
}

textarea {
  min-height: 30rem;
  resize: both;
}
</style>
