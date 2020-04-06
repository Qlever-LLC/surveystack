<template>
  <div>
    <v-textarea
      filled
      rows="8"
      :value="valueString"
      @input="writeBack($event)"
      outlined
      style="font-family: monospace; font-size: 0.8rem"
      :label="label"
    ></v-textarea>
  </div>
</template>
<script>
export default {
  props: {
    value: {
      required: true,
    },
    label: {
      type: String,
      default: 'Data',
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
        console.log(error);
      }
    },
  },
};
</script>

<style scoped>
textarea {
  font-family: monospace;
}
</style>
