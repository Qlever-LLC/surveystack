<template>
  <div>
    <a-textarea
      filled
      :rows="rows"
      :value="valueString"
      @input="writeBack($event)"
      outlined
      :label="label"
      cssFontMonospace
    />
  </div>
</template>
<script>
import ATextarea from '@/components/ui/ATextarea.vue';
export default {
  components: {
    ATextarea,
  },
  props: {
    value: {
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
