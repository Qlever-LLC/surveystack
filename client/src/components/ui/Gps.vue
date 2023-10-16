<template>
  <div>
    <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <a-btn v-bind="attrs" v-on="on" class="button">
          <v-icon>mdi-dots-vertical</v-icon>
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
        <a-btn @click="clipboard" outlined class="mt-1"> <v-icon left>mdi-content-copy</v-icon>Copy </a-btn>
      </div>
    </v-menu>
    <!-- TODO: fix copied snack notification -->
    <v-snackbar v-model="snackbar">
      {{ snackbarText }}
      <a-btn color="pink" text @click="snackbar = false"> Close </a-btn>
    </v-snackbar>
  </div>
</template>

<script>
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
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
