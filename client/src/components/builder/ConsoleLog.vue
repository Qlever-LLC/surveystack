<template>
  <a-card dark class="mt-4">
    <v-card-title color="blue-grey"
      >Console Log<v-spacer></v-spacer>
      <v-icon @click="$emit('clear')">mdi-delete</v-icon>
    </v-card-title>

    <textarea class="console-container" readonly :value="log"> </textarea>
  </a-card>
</template>
<script>
import ACard from '@/components/ui/ACard.vue';
export default {
  components: {
    ACard,
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
