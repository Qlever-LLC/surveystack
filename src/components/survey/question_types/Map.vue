<template>
  <v-container fluid>
    <v-row
      align="center"
      justify="center"
    >
      <div
        id="map-question"
        class="ml-n4"
        v-if="!mapError"
      >
        <img
          v-if="!this.value"
          id="map-marker"
          src="@/assets/marker.svg"
          alt="marker"
        />

        <v-container
          id="map-center"
          v-if="mapCenter"
        > <kbd class="pa-2">Map Center<br> lat: {{ mapCenter.lat }}<br> lng: {{ mapCenter.lng }}</kbd></v-container>
      </div>
      <v-alert
        type="info"
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

        <p class="headline">{{ control.label }}<span class="subtitle-1 ml-2"> {{ control.name }}</span></p>

        <template v-if="!location">
          <v-btn
            large
            :disabled="disablePick"
            :dark="!disablePick"
            class="mx-4 full"
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
        <v-container v-if="value">
          Selected <kbd>lat: {{ value.lat }}</kbd> <kbd>lng: {{ value.lng }}</kbd>
          <br>
          <v-btn
            @click="clipboard(value)"
            dark
            color="blue"
          >
            <v-icon left>mdi-clipboard</v-icon>Copy to Clipboard
          </v-btn>
        </v-container>

        <v-container v-if="gps">
          GPS <kbd>lat: {{ gps.lat }}</kbd> <kbd>lng: {{ gps.lng }}</kbd> <kbd>acc: {{ gps.acc }}</kbd>
          <br>
          <v-btn
            @click="clipboard(gps)"
            dark
            color="blue"
          >
            <v-icon left>mdi-clipboard</v-icon>Copy to Clipboard
          </v-btn>
        </v-container>
        <v-container v-else>
          <v-row
            class="fill-height"
            align-content="center"
            justify="center"
          >
            <v-col
              class="subtitle-1 text-center"
              cols="12"
            >
              Getting GPS Coordinates
            </v-col>
            <v-col cols="6">
              <v-progress-linear
                color="red accent-4"
                indeterminate
                rounded
                height="6"
              ></v-progress-linear>
            </v-col>
          </v-row>
        </v-container>

      </v-container>
    </v-row>

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
      gps: null,
      snackbar: false,
      snackbarText: '',
      geolocationID: null,
      mapCenter: null,
    };
  },
  methods: {
    clipboard(obj) {
      navigator.clipboard.writeText(`${obj.lat}, ${obj.lng}`).then(() => {
        this.snackbarText = 'Copied Text to Clipboard';
        this.snackbar = true;
      }, (err) => {
        console.error('Async: Could not copy text: ', err);
      });
    },
    pickLocation() {
      console.log(this.map.getCenter());
      const loc = this.mapError ? this.gps : this.map.getCenter();
      this.changed(loc);
      this.location = loc;
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
    handleMap(map, control) {
      const ctrl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      });

      map.addControl(ctrl);
      map.on('error', () => {
        this.mapError = true;
      });

      map.on('touchmove', () => {
        this.mapCenter = map.getCenter();
      });

      map.on('moveend', () => {
        this.mapCenter = map.getCenter();
      });


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
    disablePick() {
      return !this.gps && this.mapError;
    },
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

    if (navigator.geolocation) {
      this.geolocationID = navigator.geolocation.watchPosition((position) => {
        console.log(position);
        this.gps = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          acc: position.coords.accuracy,
        };
      });
    }
  },
  beforeDestroy() {
    console.log('removing map');
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(this.geolocationID);
    }
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

#map-center {
  position: absolute;
  z-index: 1;
}

.mapboxgl-ctrl-geolocate::before {
  content: "\F352";
  font: normal normal normal 24px/1 "Material Design Icons";
}
</style>
