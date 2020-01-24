<template>
  <v-row align="center">
    <v-card width="100%" height="100%">
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


export default {
  data() {
    return {
      map: null,
    };
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
  },
};
</script>

<style>
@import url("https://api.mapbox.com/mapbox-gl-js/v1.4.1/mapbox-gl.css");

#map-question {
  height: 70vh;
  width: 100%;
}

#map-marker {
  position: absolute;
  width: 5rem;
  height: 5rem;
  margin-left: -2.5rem;
  margin-top: -5rem;
  top: 50%;
  left: 50%;
  z-index: 100;
}
</style>
