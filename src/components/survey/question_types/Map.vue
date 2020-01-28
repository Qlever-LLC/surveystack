<template>
  <v-row align="center">
    <v-card
      width="100%"
      height="100%"
    >
      <div id="map-question">
        <img
          id="map-marker"
          src="@/assets/marker.svg"
          alt="marker"
        />
      </div>

      <v-card-title class="headline">Pick Location</v-card-title>
      <v-card-subtitle>Pick a location on the Map.</v-card-subtitle>
      <v-card-actions>
        <v-btn
          text
          dark
          color="indigo"
          @click="pickLocation()"
        >Pick</v-btn>
      </v-card-actions>

    </v-card>
  </v-row>
</template>
<script>
/* eslint-disable no-new */

import mapboxgl from 'mapbox-gl';
import controlValidator from '@/utils/controlValidator';


let wakeLock = null;

const requestWakeLock = async () => {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock was released');
    });
    console.log('Wake Lock is active');
  } catch (e) {
    console.error(`${e.name}, ${e.message}`);
  }
};


export default {
  data() {
    return {
      map: null,
    };
  },
  props: {
    controlArgs: {
      type: Object,
      required: true,
      validator: controlValidator,
    },
  },
  methods: {
    pickLocation() {
      console.log(this.map.getCenter());
    },
  },
  mounted() {
    mapboxgl.accessToken = 'pk.eyJ1Ijoib3Vyc2NpIiwiYSI6ImNqb2ljdHMxYjA1bDAzcW03Zjd0cHBsbXMifQ.rL9QPLvi0kLP3DzLt1PQBA';
    this.map = new mapboxgl.Map({
      container: 'map-question',
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [8.311068, 47.462507],
      zoom: 15,
    });

    this.map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
    );

    requestWakeLock();
  },
};
</script>

<style>
@import url("https://api.mapbox.com/mapbox-gl-js/v1.4.1/mapbox-gl.css");

#map-question {
  height: 50vh;
  width: 100%;
}

#map-marker {
  position: absolute;
  width: 2rem;
  height: 2rem;
  margin-left: -1rem;
  margin-top: -2rem;
  top: 50%;
  left: 50%;
  z-index: 1;
}

.mapboxgl-ctrl-geolocate::before {
  content: "\F352";
  font: normal normal normal 24px/1 "Material Design Icons";
}
</style>
