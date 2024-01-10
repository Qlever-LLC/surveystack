<template>
  <a-card class="mt-4">
    <a-card-title>
      Console Log<a-spacer />
      <a-icon @click="$emit('clear')">mdi-delete</a-icon>
    </a-card-title>

    <textarea class="console-container" readonly :value="log"> </textarea>
  </a-card>
</template>
<script>
export default {
  props: {
    log: {
      required: false,
    },
  },
};
</script>

<style scoped lang="scss">
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
