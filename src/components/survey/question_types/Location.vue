<template>
  <div>
    <p v-if="control.title" class="mb-2">{{ control.title }}</p>
    <div id="map-root" :class="{'shorter-map': (!!control.hint || !!control.title) }">

      <v-card
        id="map-header"
        dark
        color="gray"
        class="body-1 font-weight-n pa-2 px-4 mt-0"
        style="width: 100%"
      > {{ control.label }}</v-card>

      <div
        id="map-container"
        class="my-2"
        v-if="!mapError"
      >
        <div id="gps-info">
          <app-gps
            :expanded="false"
            :location="currentLocation.location"
          >{{ currentLocation.label }}</app-gps>
        </div>
        <div
          style="background-color: #000"
          :id="`map-question-${index}`"
          class="map-question"
          v-if="!mapError"
        >

          <img
            v-if="!this.value"
            id="map-marker"
            src="@/assets/marker.svg"
            alt="marker"
          />
        </div>
      </div>

      <div
        id="map-error-alert"
        class="my-4"
        v-else
      >

        <v-alert
          type="info"
          border="right"
          prominent
        >
          Error loading map. Unable to load map. Using GPS coordinates.
        </v-alert>

        <div>
          <app-gps
            :expanded="true"
            :location="currentLocation.location"
          >{{ currentLocation.label }}</app-gps>
        </div>

      </div>

      <v-container
        id="map-footer"
        class="infos grey--text text--darken-2 text-center"
        fluid
      >
        <template v-if="!location">
          <v-btn
            large
            class="mx-4 full"
            outlined
            color="blue"
            @click="skip"
          >Skip</v-btn>
          <v-btn
            large
            :disabled="disablePick"
            :dark="!disablePick"
            class="mx-4 full"
            color="blue"
            @click="pickLocation"
          >Pick</v-btn>
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
        <v-container v-if="!gps">
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
      <p v-if="control.hint" class="mt-4 mb-0">{{ control.hint }}</p>

    </div>
  </div>
</template>
<script>
/* eslint-disable no-new */

import mapboxgl from 'mapbox-gl';
import appGps from '@/components/ui/Gps.vue';
import baseQuestionComponent from './BaseQuestionComponent';


let wakeLock = null;

const requestWakeLock = async () => {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      // console.log('Wake Lock was released');
    });
    // console.log('Wake Lock is active');
  } catch (e) {
    console.error(`${e.name}, ${e.message}`);
  }
};

export default {
  mixins: [baseQuestionComponent],
  components: {
    appGps,
  },
  data() {
    return {
      panel: [0],
      map: null,
      mapError: false,
      first: true,
      location: null,
      gps: null,
      geolocationID: null,
      mapCenter: null,
      usingGPS: true,
      marker: null,
      ctrl: null,
    };
  },
  methods: {
    geoJsonFromLngLat({ lng, lat }) {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          accuracy: null,
        },
      };
    },
    geoJsonFromPosition({ coords }) {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [coords.longitude, coords.latitude],
        },
        properties: {
          accuracy: coords.accuracy,
        },
      };
    },
    pickLocation() {
      const loc = this.usingGPS ? this.gps : this.geoJsonFromLngLat(this.map.getCenter());
      this.changed(loc);
      this.location = loc;
      this.next();
    },
    skip() {
      this.next();
    },
    retake() {
      this.changed(null);
      if (this.marker) {
        this.marker.remove();
      }
      this.location = null;
      this.hideNext();
      this.ctrl.trigger();
    },
    handleMap(map, value) {
      this.ctrl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      });

      map.addControl(this.ctrl);
      map.on('error', () => {
        this.mapError = true;
        this.usingGPS = true;
      });

      map.on('drag', () => {
        this.usingGPS = false;
        this.mapCenter = map.getCenter();
      });

      this.ctrl.on('trackuserlocationstart', () => {
        this.usingGPS = true;
      });


      // this.ctrl.on('trackuserlocationend', () => {
      //   console.log('trackuserlocationend');
      // });

      map.on('load', () => {
        if (!value) {
          this.ctrl.trigger();
        }
        map.resize();
      });

      this.ctrl.on('geolocate', (e) => {
        if (!this.first) {
          return;
        }

        map.stop();
        map.jumpTo({
          center: [e.coords.longitude, e.coords.latitude],
        });

        this.first = false;
      });

      if (value) {
        // this.marker = new mapboxgl.Marker()
        //   .setLngLat([value.lng, value.lat])
        //   .addTo(map);

        // map.jumpTo({
        //   center: [value.lng, value.lat],
        // });
        this.marker = new mapboxgl.Marker()
          .setLngLat([value.geometry.coordinates[0], value.geometry.coordinates[1]])
          .addTo(map);

        map.jumpTo({
          center: [value.geometry.coordinates[0], value.geometry.coordinates[1]],
        });
      }
    },
  },
  computed: {
    currentLocation() {
      if (this.value) {
        return {
          location: this.value,
          // label: `used ${this.value.acc ? ' GPS' : 'Map Center'}`,
          label: `used ${this.value.properties ? ' GPS' : 'Map Center'}`,
        };
      }

      return {
        location: this.usingGPS ? this.gps : this.geoJsonFromLngLat(this.mapCenter),
        label: this.usingGPS ? 'Using GPS' : 'Using Map Center',
      };
    },
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
    // console.log(`mounted, ${this.map}`);

    setTimeout(() => {

    }, 2000);

    // console.log('loading map', this.index);
    mapboxgl.accessToken = 'pk.eyJ1Ijoib3Vyc2NpIiwiYSI6ImNqb2ljdHMxYjA1bDAzcW03Zjd0cHBsbXMifQ.rL9QPLvi0kLP3DzLt1PQBA';
    this.map = new mapboxgl.Map({
      container: `map-question-${this.index}`,
      style: 'mapbox://styles/mapbox/satellite-v9',
      // center: [8.311068, 47.462507],
      zoom: 15,
    });

    this.handleMap(this.map, this.value);
    if (!this.value) {
      // console.log('hiding next');
      this.hideNext();
    }

    if (wakeLock in navigator) {
      requestWakeLock();
    }

    if (navigator.geolocation) {
      this.geolocationID = navigator.geolocation.watchPosition((position) => {
        this.gps = this.geoJsonFromPosition(position);
      });
    }
  },
  beforeDestroy() {
    // console.log('removing map');
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(this.geolocationID);
    }
    this.map.remove();
  },
};
</script>


<style>
@import url('~mapbox-gl/dist/mapbox-gl.css');
#map-root {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  width: 100%;
  /* height: 60vh; */
  width: 100%;
  min-height: 60vh;
}


#map-root.shorter-map  {
  height: 90%;
}

#map-header {
  grid-column: 1;
  grid-row: 1;
}

#gps-info {
  position: absolute;
  left: 0;
  top: 0;
  margin-left: 0.2rem;
  margin-top: 0.2rem;
  z-index: 1;
  display: block;
}

#map-container {
  position: relative;
  grid-column: 1;
  grid-row: 2;
  height: 100%;
  overflow: auto;
  max-height: 100%;
}


#map-errpr-alert {
  position: relative;
  grid-column: 1;
  grid-row: 2;
  height: 100%;
  overflow: auto;
  max-height: 100%;
}

#map-footer {
  grid-column: 1;
  grid-row: 3;
}

.map-question {
  left: 0px;
  top: 0px;
  position: absolute;
  width: 100%;
  padding: 0px;
  /* min-height: 100%; */
  height: 100%;
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

/* .mapboxgl-ctrl-geolocate::before {
  content: "\F01A4";
  font: normal normal normal 24px/1 "Material Design Icons";
  margin-top: 3px;
  display: block;
} */
</style>
