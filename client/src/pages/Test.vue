<template>
  <div>
    <h2>Hi</h2>
    Add Feedback to store
    <v-text-field v-model="message" @keyup.enter="addFeedback(message)" placeholder="Feedback..." />
    <v-btn @click="addFeedback(message)">ADD</v-btn>
  </div>
</template>

<script>
import ATextField from '@/components/ui/ATextField.vue';
export default {
  components: {
    ATextField,
  },
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
