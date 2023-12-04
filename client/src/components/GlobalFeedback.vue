<template>
  <a-container v-if="hasFeedback">
    <a-spacer />
    <div class="d-flex justify-end">
      <a-btn variant="text" @click="clearAllFeedback"> <a-icon left>mdi-close</a-icon>{{ clearAllText }} </a-btn>
    </div>
    <a-alert v-for="(feedback, idx) in items" :key="idx" border="left" :type="feedback.type" elevation="2">
      {{ feedback.message }}
    </a-alert>
  </a-container>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
  setup () {
    const store = useStore();

    const items = computed(() => {
      return store.state.feedback.items;
    });

    const hasFeedback = computed(() => {
      return store.getters['feedback/hasFeedback'];
    });

    const clearAllText = computed(() => {
      return items.value.length > 1 ? 'Clear all' : 'Clear';
    });

    const removeFeedback = (idx) => {
      store.dispatch('feedback/remove', idx);
    };

    const clearAllFeedback = () => {
      store.dispatch('feedback/reset');
    };

    return {
      items,
      hasFeedback,
      clearAllText,
      removeFeedback,
      clearAllFeedback,
    };
  }
};
</script>
