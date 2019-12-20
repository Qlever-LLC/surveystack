<template>
  <div>
    <h2>Hello</h2>
    <input v-model="message" @keyup.enter="addFeedback(message)" />
    <button @click="addFeedback(message)">ADD</button>
    <ul v-if="hasFeedback">
      <li v-for="(msg, idx) in feedback" :key="idx">
        {{ msg }}
        <button @click="removeFeedback(idx)">x</button>
      </li>
    </ul>
    <button v-if="hasFeedback" @click="clearAllFeedback">CLEAR ALL</button>
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
    removeFeedback(idx) {
      this.$store.dispatch('feedback/remove', idx);
    },
    clearAllFeedback() {
      this.$store.dispatch('feedback/reset');
    },
  },
  computed: {
    feedback() {
      return this.$store.state.feedback.items;
    },
    hasFeedback() {
      return this.$store.getters['feedback/hasFeedback'];
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
