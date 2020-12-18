<template>
  <div style="width: 100%">
    <v-form>
      <v-text-field
        v-model="farm.properties.name"
        label="Name"
        placeholder="Name"
        outlined
      />
      <p>{{farm}}</p>
    </v-form>
    <div
      v-if="farm != null"
      id="farmos-map"
      style="width: 100%; height: 500px"
    ></div>

    <v-btn @click="log">Log</v-btn>
  </div>
</template>

<script>
import createMap from '@/external/instance/instance';


export default {
  props: [
    'area',
    'farm',
  ],
  data() {
    return {
      layer: null,
    };
  },
  methods: {
    log() {
      console.log('aaa', this.props);
      console.log('layer', this.layer);
    },
  },
  mounted() {
    const map = createMap({
      target: 'farmos-map',
      options: {

      },
    });
    const drawingLayer = map.addLayer('vector');
    map.addBehavior('edit', { layer: drawingLayer });
    map.addBehavior('measure', { layer: drawingLayer });
    this.layer = drawingLayer;
    console.log('created map');
    // const wktOpts = {
    //   title: 'my-polygon', // defaults to 'wkt'
    //   wkt: this.props[1].geometry, // REQUIRED!
    //   color: 'orange', // defaults to 'orange'
    //   visible: true, // defaults to true
    // };
    // map.addLayer('wtk', wktOpts);
  },

};
</script>

<style>
/* Control color. */
.ol-control {
  background-color: rgba(255, 255, 255, 0.25);
}
.ol-control svg {
  fill: green;
}
.ol-control button {
  color: green;
  background-color: rgba(255, 255, 255, 0.8);
}
.ol-control button:hover,
.ol-control button:focus {
  background-color: rgba(255, 255, 255, 1);
}
.ol-scale-line {
  background: rgba(255, 255, 255, 0.25);
}

/* Control backgrounds. */
.ol-geocoder .gcd-gl-btn {
  background-image: none;
}
.ol-geocoder .gcd-gl-btn:after {
  content: "\1f50d";
}
.layer-switcher > button {
  background-size: 1.5em 1.5em;
}

/* Control sizing. */
.ol-control button,
.ol-geocoder .gcd-gl-btn {
  height: 1.75em;
  width: 1.75em;
}
.ol-geocoder .gcd-gl-control {
  width: 2.4em;
  height: 2.4em;
}
.ol-geocoder .gcd-gl-expanded {
  width: 16em;
  height: 2.4em;
}

/* Control positioning. */
.ol-geolocate.ol-control {
  left: 3.5em;
}
.ol-geocoder.gcd-gl-container {
  top: 0.5em;
  left: 6.5em;
}
.ol-geocoder .gcd-gl-input {
  left: 3em;
}
.ol-edit.ol-control {
  top: 5.5em;
}
.ol-rotate.ol-control {
  right: 3.5em;
}
.layer-switcher {
  top: 3.5em;
}
</style>
