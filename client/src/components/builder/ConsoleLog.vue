<template>
  <v-card dark background-color="dark-blue" class="mt-4">
    <v-card-title color="blue-grey">
      Console Log<a-spacer />
      <a-icon @click="$emit('clear')">mdi-delete</a-icon>
    </v-card-title>

    <textarea class="console-container" readonly :value="log"> </textarea>
  </v-card>
</template>
<script>
import AIcon from '@/components/ui/AIcon.vue';

export default {
  components: { AIcon },
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
