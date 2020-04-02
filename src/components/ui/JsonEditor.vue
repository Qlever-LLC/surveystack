<template>
  <div>
    <v-textarea
      class="app-min-height"
      filled
      rows="20"
      :value="valueString"
      @input="writeBack($event)"
      outlined
    ></v-textarea>
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
        console.log(error);
      }
    },
  },
};
</script>

<style scoped>
.app-min-height {
  min-height: 30rem;
}

div {
  background: #fff;
  padding: 2rem;
}
</style>
