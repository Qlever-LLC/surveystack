<template>
  <v-container>
    <v-row
      align="center"
      justify="center"
    >
      <v-alert>
        {{ value }}
      </v-alert>
      <div
        id="map-question"
        v-if="!mapError"
      >
        <img
          v-if="!this.value"
          id="map-marker"
          src="@/assets/marker.svg"
          alt="marker"
        />
      </div>
      <v-alert
        type="error"
        border="right"
        prominent
        v-else
      >
        Error loading map. Unable to load map. Using GPS coordinates.
      </v-alert>

      <v-container
        class="infos grey--text text--darken-2 text-center"
        fluid
      >
        <template v-if="!location">
          <p class="headline">{{ control.label }}<span class="subtitle-1 ml-2"> {{ control.name }}</span></p>
          <v-btn
            large
            class="mx-4 full"
            dark
            color="indigo"
            @click="pickLocation"
          >Pick</v-btn>

          <v-btn
            large
            class="mx-4 full"
            outlined
            color="indigo"
            @click="skip"
          >Skip</v-btn>
        </template>

        <template v-else>
          <v-btn
            large
            class="mx-4 full"
            outlined
            color="indigo"
            @click="retake"
          >Retake</v-btn>
        </template>

      </v-container>
    </v-row>
  </v-container>

</template>
<script>
/* eslint-disable no-new */

import mapboxgl from 'mapbox-gl';
import baseQuestionComponent from './BaseQuestionComponent';


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
  mixins: [baseQuestionComponent],
  data() {
    return {
      map: null,
      mapError: false,
      first: true,
      location: null,
    };
  },
  methods: {
    pickLocation() {
      console.log(this.map.getCenter());
      this.changed(this.map.getCenter());
      this.location = this.map.getCenter();
      this.next();
    },
    skip() {
      this.next();
    },
    retake() {
      this.changed(null);
      this.location = null;
      this.hideNext();
    },
    startTracking() {
      if (!navigator.geolocation) {
        return;
      }
      navigator.geolocation.watchPosition((position) => {
        console.log(position);
      });
    },
    handleMap(map, control) {
      const ctrl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      });

      map.addControl(ctrl);

      if (control.value) {
        new mapboxgl.Marker()
          .setLngLat([control.value.lng, control.value.lat])
          .addTo(map);

        map.jumpTo({
          center: [control.value.lng, control.value.lat],
        });
      } else {
        map.on('load', () => {
          ctrl.trigger();
        });

        map.on('error', () => {
          this.mapError = true;
        });

        ctrl.on('geolocate', (e) => {
          if (!this.first) {
            return;
          }

          map.stop();
          map.jumpTo({
            center: [e.coords.longitude, e.coords.latitude],
          });

          this.first = false;
        });
      }
    },
  },
  computed: {
    started() {
      return true;
    },
  },
  created() {
    this.first = true;
    this.location = this.value;
  },
  mounted() {
    console.log(`mounted, ${this.map}`);

    mapboxgl.accessToken = 'pk.eyJ1Ijoib3Vyc2NpIiwiYSI6ImNqb2ljdHMxYjA1bDAzcW03Zjd0cHBsbXMifQ.rL9QPLvi0kLP3DzLt1PQBA';
    this.map = new mapboxgl.Map({
      container: 'map-question',
      style: 'mapbox://styles/mapbox/satellite-v9',
      // center: [8.311068, 47.462507],
      zoom: 15,
    });

    this.handleMap(this.map, this.control);
    if (!this.value) {
      this.hideNext();
    }
    requestWakeLock();

    this.startTracking();
  },
  beforeDestroy() {
    console.log('removing map');
    this.map.remove();
  },
};
</script>

<style>
@import url("https://api.mapbox.com/mapbox-gl-js/v1.4.1/mapbox-gl.css");

#map-question {
  height: 50vh;
  width: 100%;
  padding: 0px;
  margin-left: 12px;
  margin-right: -12px;
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
