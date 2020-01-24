<template>
  <v-row>
    <v-card center>
      <v-card-title class="headline">Pick Location</v-card-title>
      <div id="map-question"></div>
    </v-card>
  </v-row>
</template>
<script>
/* eslint-disable no-new */

import mapboxgl from 'mapbox-gl';


export default {
  mounted: () => {
    mapboxgl.accessToken = 'pk.eyJ1Ijoib3Vyc2NpIiwiYSI6ImNqb2ljdHMxYjA1bDAzcW03Zjd0cHBsbXMifQ.rL9QPLvi0kLP3DzLt1PQBA';
    new mapboxgl.Map({
      container: 'map-question',
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [8.311068, 47.462507],
      zoom: 15,
    });
  },
};
</script>

<style>
@import url("https://api.mapbox.com/mapbox-gl-js/v1.4.1/mapbox-gl.css");

#map-question {
  height: 50vh;
  width: 50vw;
}
</style>
