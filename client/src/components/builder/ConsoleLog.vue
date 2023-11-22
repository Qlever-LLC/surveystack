<template>
  <a-card dark class="mt-4">
    <a-card-title>
      Console Log<a-spacer />
      <a-icon @click="$emit('clear')">mdi-delete</a-icon>
    </a-card-title>

    <textarea class="console-container" readonly :value="log"> </textarea>
  </a-card>
</template>
<script>
import ACard from '@/components/ui/ACard.vue';
import ACardTitle from '@/components/ui/ACardTitle.vue';

export default {
  components: {
    ACard,
    ACardTitle,
  },
  props: {
    log: {
      required: false,
    },
  },
};
</script>

<style scoped>
.console-container {
  background-color: #0004;
  padding: 12px;
  width: 100%;
  height: calc(100% - 80px);
  padding: 4px;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', 'HelveticaNeue-Light', 'Ubuntu', 'Droid Sans',
    sans-serif !important;
}
</style>
