<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      :is-modified="meta && !!meta.dateModified"
      @initialize="initialize" />
    <app-control-hint :value="control.hint" />

    <div v-show="!state.offlineMode" :id="`map-question-geocoder-${index}`" class="geocoder" style="z-index: 200" />

    <div class="map-container my-2" v-if="!state.mapError">
      <app-gps class="gps-info" :expanded="false" :location="currentLocation.location">
        {{ currentLocation.label }}
      </app-gps>

      <a-btn class="layer-switch" @click="switchMapStyle">
        <a-icon>mdi-layers-outline</a-icon>
      </a-btn>

      <div style="background-color: #000" :id="`map-question-${index}`" class="map-question" v-if="!state.mapError">
        <img v-if="!modelValue" id="map-marker" :src="require('@/assets/marker.svg')" alt="marker" />
        <div class="selection-controls d-flex justify-center">
          <div v-if="!state.location">
            <a-btn large :disabled="disablePick" class="mx-4 full" color="primary" @click="pickLocation"> Pick </a-btn>
          </div>
          <div v-else>
            <a-btn large class="mx-4 full" color="gray" @click="reset"> Reset</a-btn>
          </div>
        </div>
      </div>
    </div>

    <div id="map-error-alert" class="my-4" v-else-if="state.offlineMode">
      <a-alert type="info" border="end" prominent>
        <b>Offline-Mode</b>: Map unavailable, but position can be determined if permission is granted
      </a-alert>
      <div>
        Current location:
        <samp v-if="currentLocation && currentLocation.location">
          <br />
          lng:&nbsp;{{ currentLocation.location.geometry.coordinates[0].toFixed(5) }}
          <br />
          lat:&nbsp;{{ currentLocation.location.geometry.coordinates[1].toFixed(5) }}
          <br />
          <span v-if="currentLocation.location.properties.accuracy">
            acc:&nbsp;{{ currentLocation.location.properties.accuracy.toFixed(2) }}
          </span>
          <br />
          <a-btn @click="loadCurrentPositionOffline()">Refresh Location</a-btn>
        </samp>
        <samp v-else>unavailable</samp>
      </div>
    </div>

    <div id="map-error-alert" class="my-4" v-else>
      <a-alert type="info" border="end" prominent> Error loading map.</a-alert>
      <app-gps :expanded="true" :location="currentLocation.location">
        {{ currentLocation.label }}
      </app-gps>
    </div>

    <a-overlay
      class="text-center"
      :modelValue="!modelValue && !state.gpsLocation && !state.mapError && !state.geolocationError"
      absolute>
      <a-card>
        <a-card-text>
          <div class="subtitle-1 text-center">Getting GPS Coordinates</div>
          <div class="mt-2">
            <a-progress-linear rounded height="6" />
          </div>
        </a-card-text>
      </a-card>
    </a-overlay>
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script setup>
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

import AppGps from '@/components/ui/Gps.vue';
import { isOnline } from '@/utils/surveyStack';
import { geoJsonFromLngLat, geoJsonFromPosition, requestWakeLock } from '@/components/survey/question_types/Location';
import {
  QuestionComponentEmits,
  QuestionComponentProps,
  useQuestionComponent,
} from '@/components/survey/question_types/questionComponent';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, watch } from 'vue';

const MAP_STYLES = [
  'mapbox://styles/mapbox/satellite-v9',
  'mapbox://styles/mapbox/streets-v9',
  'mapbox://styles/mapbox/outdoors-v9',
];

const props = defineProps(QuestionComponentProps);
const emit = defineEmits(QuestionComponentEmits);

const { changed, initialize } = useQuestionComponent(emit);

const state = reactive({
  location: props.modelValue,
  usingGPS: true,
  panel: [0],
  map: null,
  mapStyle: MAP_STYLES[0],
  marker: null,
  ctrl: null,
  mapError: false,
  offlineMode: false,
  gpsLocation: null,
  gpsTimer: 0,
  geolocationError: false,
});

function pickLocation() {
  state.location = state.usingGPS ? state.gpsLocation : geoJsonFromLngLat(state.map.getCenter());
  changed(state.location);

  if (!state.location || !state.map) {
    return;
  }

  if (state.marker) {
    state.marker.remove();
    state.marker = null;
  }

  state.marker = new mapboxgl.Marker().setLngLat(state.location.geometry.coordinates).addTo(state.map);
}

function reset() {
  changed(null);
  if (state.marker) {
    state.marker.remove();
    state.marker = null;
  }
  state.location = null;
  startGpsTimer();
}

function switchMapStyle() {
  const index = MAP_STYLES.indexOf(state.mapStyle);
  const newIndex = (index + 1) % MAP_STYLES.length;
  state.mapStyle = MAP_STYLES[newIndex];
  state.map.setStyle(state.mapStyle);
}

function startGpsTimer() {
  state.ctrl.trigger();
  stopGpsTimer();
  state.gpsTimer = setTimeout(() => {
    console.warn('No confirmation from the user permission');
    state.geolocationError = 'No confirmation from the user permission';
    state.usingGPS = false;
  }, 30000);
}

function stopGpsTimer() {
  if (!state.gpsTimer) {
    return;
  }

  clearTimeout(state.gpsTimer);
  state.gpsTimer = 0;
}

function startMap() {
  mapboxgl.accessToken = 'pk.eyJ1Ijoib3Vyc2NpIiwiYSI6ImNqb2ljdHMxYjA1bDAzcW03Zjd0cHBsbXMifQ.rL9QPLvi0kLP3DzLt1PQBA';
  state.map = new mapboxgl.Map({
    container: `map-question-${props.index}`,
    style: state.mapStyle,
    zoom: 15,
  });

  const geocoder = new MapboxGeocoder({
    // Initialize the geocoder
    accessToken: mapboxgl.accessToken, // Set the access token
    mapboxgl: state.map, // Set the mapbox-gl instance
    marker: false, // Do not use the default marker style
  });

  geocoder.on('result', () => {
    state.usingGPS = false;
  });

  document.getElementById(`map-question-geocoder-${props.index}`).appendChild(geocoder.onAdd(state.map));

  state.ctrl = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true,
    },
    trackUserLocation: true,
  });

  state.ctrl.on('trackuserlocationstart', () => {
    state.usingGPS = true;
  });

  state.ctrl.on('geolocate', (position) => {
    stopGpsTimer();
    state.gpsLocation = geoJsonFromPosition(position);
  });

  state.ctrl.on('error', (e) => {
    console.warn(e);
    state.geolocationError = e;
    state.usingGPS = false;
    stopGpsTimer();
  });

  state.map.addControl(state.ctrl);

  if (props.modelValue) {
    state.marker = new mapboxgl.Marker().setLngLat(props.modelValue.geometry.coordinates).addTo(state.map);

    state.map.jumpTo({
      center: props.modelValue.geometry.coordinates,
    });
  }

  state.map.on('load', () => {
    if (!props.modelValue) {
      startGpsTimer();
    }
    state.map.resize();
  });

  state.map.on('error', (err) => {
    console.log(err);
    state.mapError = true;
    state.usingGPS = true;
    if (!isOnline()) {
      loadCurrentPositionOffline();
    }
  });

  state.map.on('drag', () => {
    state.usingGPS = false;
  });
}

function loadCurrentPositionOffline() {
  if (navigator.geolocation) {
    state.offlineMode = true;
    navigator.geolocation.getCurrentPosition((position) => {
      state.gpsLocation = geoJsonFromPosition(position);
      changed(state.gpsLocation);
    });
  }
}

const currentLocation = computed(() => {
  if (props.modelValue) {
    return {
      location: props.modelValue,
      // label: `used ${props.modelValue.acc ? ' GPS' : 'Map Center'}`,
      label: `${props.modelValue.properties ? 'Saved Location' : 'Current Map Center'}`,
    };
  }

  return {
    location: state.usingGPS ? state.gpsLocation : geoJsonFromLngLat(state.map.getCenter()),
    label: state.usingGPS ? 'Using GPS' : 'Using Map Center',
  };
});

const disablePick = computed(() => {
  return state.geolocationError && state.mapError;
});

watch(
  () => state.gpsLocation,
  async (value, prevValue) => {
    if (value) {
      stopGpsTimer();
    }

    if (!state.map || !state.usingGPS) {
      return;
    }

    state.map.stop();
    state.map.jumpTo({ center: value.geometry.coordinates });
  },
  { deep: true }
);

onMounted(() => {
  startMap();
  requestWakeLock();
});

onBeforeUnmount(() => {
  stopGpsTimer();
  state.map.remove();
});
</script>

<style scoped src="./Location.css"></style>
