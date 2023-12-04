<template>
  <div>
    <a-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <a-btn v-bind="attrs" v-on="on" class="button">
          <a-icon>mdi-dots-vertical</a-icon>
        </a-btn>
      </template>
      <div class="menu">
        <div>
          <slot></slot>
        </div>
        <div class="text-body-2 text-sm-body-1" v-if="location && location.geometry && location.properties">
          <samp>
            lng:&nbsp;{{ location.geometry.coordinates[0].toFixed(5) }}
            <br />
            lat:&nbsp;{{ location.geometry.coordinates[1].toFixed(5) }}
            <br />
            <span v-if="location.properties.accuracy"> acc:&nbsp;{{ location.properties.accuracy.toFixed(2) }} </span>
          </samp>
        </div>
        <a-btn @click="clipboard" variant="outlined" class="mt-1"> <a-icon left>mdi-content-copy</a-icon>Copy </a-btn>
      </div>
    </a-menu>
    <!-- TODO: fix copied snack notification -->
    <a-snackbar v-model="snackbar">
      {{ snackbarText }}
      <a-btn color="pink" variant="text" @click="snackbar = false"> Close </a-btn>
    </a-snackbar>
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
      navigator.clipboard.writeText(text).then(
        () => {
          // TODO: snackbar appears behind prev/next buttons and not sure how to fix this right now
          // this.snackbarText = 'Copied Text to Clipboard';
          // this.snackbar = true;
        },
        (err) => {
          console.error('Async: Could not copy text: ', err);
        }
      );
    },
  },
};
</script>
<style scoped>
/* .map-container {
  font-family: monospace;
  justify-content: left;
} */

.button.v-btn {
  min-width: unset;
  width: 29px;
  height: 29px;
  padding: 0;
}

.menu {
  background-color: white;
  padding: 1rem;
  border-radius: 3px;
}
</style>
