<template>
  <div>
    <h2>Hi</h2>Add Feedback to store
    <input v-model="message" @keyup.enter="addFeedback(message)" />
    <button @click="addFeedback(message)">ADD</button>
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

<style scoped>
/* This works if style is not scoped! */

:root {
  --bg-color: rebeccapurple;
}

h2 {
  color: var(--bg-color);
}
</style>
