<template>
  <div>
    <textarea class="form-control" :value="valueString" @input="writeBack($event.target.value)"></textarea>
  </div>
</template>
<script>
export default {
  props: {
    value: {
      required: true,
    },
  },
  computed: {
    valueString() {
      return JSON.stringify(this.value, null, 2);
    },
  },
  methods: {
    writeBack(value) {
      try {
        const obj = JSON.parse(value);
        if (JSON.stringify(this.value) !== JSON.stringify(obj)) {
          this.$emit('input', obj);
        }
      } catch (error) {
        console.log('parsing failed', error);
      }
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
