<template>
  <div v-if="hasFeedback" class="feedback-container">
    <h3>Feedback</h3>
    <ul>
      <li v-for="(msg, idx) in feedback" :key="idx">
        {{ msg }}
        <button @click="removeFeedback(idx)">x</button>
      </li>
    </ul>
    <v-btn v-if="hasFeedback" @click="clearAllFeedback">CLEAR ALL</v-btn>
  </div>
</template>


<script>
export default {
  methods: {
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

<style scoped>
.feedback-container {
  border: 2px solid #5d7557;
  padding: 0.5rem;
}

ul {
  list-style-type: none;
}
</style>
