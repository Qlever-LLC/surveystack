<template>

  <div>
    <v-expansion-panels
      v-if="location"
      dark
      color="gray"
      class="map-container font-weight-bold pa-2"
      v-model="expandedVal"
    >
      <v-expansion-panel
        class="ma-4"
        style="flex-basis: unset; flex-grow: 0;"
      >
        <v-expansion-panel-header>
          <slot></slot>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <!-- lat: {{ location.lat.toFixed(7) }}
          <br>
          lng: {{ location.lng.toFixed(7) }}
          <template v-if="location.acc">
            <br>
            acc: {{ location.acc.toFixed(2) }}
          </template> -->
          lng: {{ location.geometry.coordinates[0].toFixed(7) }}
          <br>
          lat: {{ location.geometry.coordinates[1].toFixed(7) }}
          <template v-if="location.properties.accuracy">
            <br>
            acc: {{ location.properties.accuracy.toFixed(2) }}
          </template>
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
      expandedVal: this.expanded ? 0 : null,
    };
  },
  // props: [
  //   'location',
  //   'expanded',
  // ],
  props: {
    location: {
      type: Object,
      default: () => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [null, null],
        },
        properties: {},
      }),
    },
    expanded: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    clipboard() {
      // const text = this.location.acc ? `${this.location.lat}, ${this.location.lng}, ${this.location.acc}` : `${this.location.lat}, ${this.location.lng}`;
      const text = this.location.properties.accuracy
        ? `${this.location.geometry.coordinates[0]}, ${this.location.geometry.coordinates[1]}, ${this.location.properties.accuracy}`
        : `${this.location.geometry.coordinates[0]}, ${this.location.geometry.coordinates[1]}`;
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
  justify-content: left;
}
</style>
