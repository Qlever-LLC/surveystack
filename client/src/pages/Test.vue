<template>
  <div>
    <h2>Hi</h2>
    Add Feedback to store
    <a-text-field v-model="message" @keyup.enter="addFeedback(message)" placeholder="Feedback..." />
    <a-btn @click="addFeedback(message)">ADD</a-btn>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: '',
    };
  },
  methods: {
    addFeedback(message) {
      this.$store.dispatch('feedback/add', message);
      this.message = '';
    },
  },
};
</script>

<style scoped lang="scss">
/* This works if style is not scoped! */

:root {
  --bg-color: rebeccapurple;
}

h2 {
  color: var(--bg-color);
}
</style>
