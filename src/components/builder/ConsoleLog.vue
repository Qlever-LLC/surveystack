<template>
  <v-card
    dark
    background-color="dark-blue"
    class="mt-4"
  >
    <v-card-title color="blue-grey">Console Log<v-spacer></v-spacer>
      <v-icon @click="$emit('clear')">mdi-delete</v-icon>
    </v-card-title>

    <textarea
      class="console-container"
      readonly
      :value="log"
    >
    </textarea>
  </v-card>
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

<style scoped>
.console-container {
  background-color: #0004;
  padding: 12px;
  width: 100%;
  height: 100%;
  min-height: 100%;
  max-height: 100%;
  padding: 4px;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI",
    "HelveticaNeue-Light", "Ubuntu", "Droid Sans", sans-serif !important;
}
</style>
