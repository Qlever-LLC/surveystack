<template>
  <div>
    <a-textarea
      :rows="rows"
      :modelValue="valueString"
      @update:modelValue="writeBack($event)"
      :label="label"
      cssFontMonospace />
  </div>
</template>
<script>
export default {
  props: {
    modelValue: {
      required: true,
    },
    label: {
      type: String,
      default: 'Data',
    },
    rows: {
      type: Number,
      default: 8,
    },
  },
  computed: {
    valueString() {
      return JSON.stringify(this.modelValue, null, 2);
    },
  },
  methods: {
    writeBack(value) {
      try {
        const obj = JSON.parse(value);
        if (JSON.stringify(this.modelValue) !== JSON.stringify(obj)) {
          this.$emit('update:modelValue', obj);
        }
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>
