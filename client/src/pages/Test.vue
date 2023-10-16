<template>
  <div>
    <h2>Hi</h2>
    Add Feedback to store
    <v-text-field v-model="message" @keyup.enter="addFeedback(message)" placeholder="Feedback..." />
    <a-btn @click="addFeedback(message)">ADD</a-btn>
  </div>
</template>

<script>
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
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
