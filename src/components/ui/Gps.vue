<template>

  <div>
    <v-expansion-panels
      v-if="location"
      dark
      color="gray"
      class="map-container font-weight-bold pa-2"
    >
      <v-expansion-panel>
        <v-expansion-panel-header>
          <slot></slot>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          lat: {{ location.lat.toFixed(7) }}
          <br>lng: {{ location.lng.toFixed(7) }}
          <template v-if="location.acc"><br>acc: {{ location.acc.toFixed(2) }}</template>
          <br>
          <v-btn
            @click="clipboard"
            outlined
            color="white"
          >
            <v-icon left>mdi-clipboard</v-icon>Copy
          </v-btn>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-snackbar v-model="snackbar">
      {{ snackbarText }}
      <v-btn
        color="pink"
        text
        @click="snackbar = false"
      >
        Close
      </v-btn>
    </v-snackbar>
  </div>
</template>

<script>
export default {
  data() {
    return {
      snackbar: false,
      snackbarText: '',
    };
  },
  props: [
    'location',
  ],
  methods: {
    clipboard() {
      const text = this.location.acc ? `${this.location.lat}, ${this.location.lng}, ${this.location.acc}` : `${this.location.lat}, ${this.location.lng}`;
      navigator.clipboard.writeText(text).then(() => {
        this.snackbarText = 'Copied Text to Clipboard';
        this.snackbar = true;
      }, (err) => {
        console.error('Async: Could not copy text: ', err);
      });
    },
  },
};
</script>
<style scoped>
.map-container {
  font-family: monospace;
}
</style>
