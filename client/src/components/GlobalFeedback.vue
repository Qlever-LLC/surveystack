<template>
  <a-container v-if="hasFeedback">
    <a-spacer />
    <div class="d-flex justify-end">
      <v-btn text @click="clearAllFeedback"> <a-icon left>mdi-close</a-icon>{{ clearAllText }} </v-btn>
    </div>
    <a-alert v-for="(feedback, idx) in items" :key="idx" border="left" :type="feedback.type" elevation="2">
      {{ feedback.message }}
    </a-alert>
  </a-container>
</template>

<script>
import AContainer from '@/components/ui/AContainer.vue';

export default {
  components: {
    AContainer,
  },
  data() {
    return {};
  },
  methods: {
    removeFeedback(idx) {
      this.$store.dispatch('feedback/remove', idx);
    },
    clearAllFeedback() {
      this.$store.dispatch('feedback/reset');
    },
  },
  computed: {
    items() {
      return this.$store.state.feedback.items;
    },
    hasFeedback() {
      return this.$store.getters['feedback/hasFeedback'];
    },
    clearAllText() {
      if (this.$store.state.feedback.items.length > 1) {
        return 'Clear all';
      }
      return 'Clear';
    },
  },
};
</script>
