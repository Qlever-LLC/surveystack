<template>
  <div>
    <h2>Hello</h2>Add Feedback to store
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

<style>
@import ("../assets/vars.css");

:root {
  /* --bg-color: rebeccapurple; */
}

body {
  background-color: var(--bg-color);
}
</style>
