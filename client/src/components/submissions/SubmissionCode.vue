<template>
  <div class="pa-3">
    <a-textarea class="textarea" :modelValue="valueString" rows="30" readonly hideDetails />
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

<style scoped lang="scss">
.textarea {
  width: 100%;
  font-family: monospace;
  font-size: 0.75rem;
  color: #333;
  border: 1px solid #bbb;
  background-color: whitesmoke;
}
</style>
