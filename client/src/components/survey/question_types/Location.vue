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

    <div v-if="!state.offlineMode">
      <mapbox-geocoder-control
        ref="mapboxGeocoderRef"
        :accessToken="state.accessToken"
        @result="changeLocation"
        class="mb-2" />
      <!--mapbox-map :accessToken="state.accessToken" :mapStyle="`${state.mapStyle}-v9`" /-->
      <div class="map-container">
        <img v-if="!modelValue" id="map-marker" :src="require('@/assets/marker.svg')" alt="marker" />
        <app-gps class="gps-info" :expanded="false" :location="currentLocation.location">
          {{ currentLocation.label }}
        </app-gps>
        <a-btn class="layer-switch" @click="switchMapStyle">
          <a-icon>mdi-layers-outline</a-icon>
        </a-btn>
        <mapbox-map
          ref="mapboxMapRef"
          :accessToken="state.accessToken"
          :center="state.location?.geometry.coordinates"
          :mapStyle="state.mapStyle"
          :zoom="15">
          <mapbox-marker v-if="state.location?.geometry.coordinates" :lngLat="state.location.geometry.coordinates" />
          <mapbox-geolocate-control
            ref="mapboxGeolocateRef"
            :positionOptions="{ enableHighAccuracy: true }"
            :zoom="15"
            trackUserLocation
            @click="stopGpsTimer()" />
          <div class="selection-controls d-flex justify-center">
            <div v-if="!state.location">
              <a-btn large :disabled="disablePick" class="mx-4 full" color="primary" @click="pickLocation">
                Pick
              </a-btn>
            </div>
            <div v-else>
              <a-btn large class="mx-4 full" color="gray" @click="reset"> Reset</a-btn>
            </div>
          </div>
        </mapbox-map>
      </div>
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
import { MapboxMap, MapboxMarker, MapboxGeocoderControl, MapboxGeolocateControl } from 'vue-mapbox-ts';

import AppGps from '@/components/ui/Gps.vue';
import { isOnline } from '@/utils/surveyStack';
import { geoJsonFromLngLat, geoJsonFromPosition, requestWakeLock } from '@/components/survey/question_types/Location';
import {
  QuestionComponentEmits,
  QuestionComponentProps,
  useQuestionComponent,
} from '@/components/survey/question_types/questionComponent';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

const MAP_STYLES = [
  'mapbox://styles/mapbox/satellite-v9',
  'mapbox://styles/mapbox/streets-v9',
  'mapbox://styles/mapbox/outdoors-v9',
];

const props = defineProps(QuestionComponentProps);
const emit = defineEmits(QuestionComponentEmits);

const { changed, initialize } = useQuestionComponent(emit);

const mapboxMapRef = ref(null);
const mapboxGeocoderRef = ref(null);
const mapboxGeolocateRef = ref(null);

const state = reactive({
  location: props.modelValue,
  accessToken: 'pk.eyJ1Ijoib3Vyc2NpIiwiYSI6ImNqb2ljdHMxYjA1bDAzcW03Zjd0cHBsbXMifQ.rL9QPLvi0kLP3DzLt1PQBA',
  usingGPS: false,
  panel: [0],
  mapStyle: MAP_STYLES[0],
  marker: null,
  mapError: false,
  offlineMode: false,
  gpsLocation: null,
  gpsTimer: 0,
  geolocationError: false,
});

onMounted(() => {
  nextTick();
  nextTick();
  nextTick();
  init();
});

onBeforeUnmount(() => {
  stopGpsTimer();
  //TODO dispose map instance
});

function init() {
  requestWakeLock();
}

function pickLocation() {
  console.log('pick');
  state.location = state.usingGPS ? state.gpsLocation : geoJsonFromLngLat(mapboxMapRef.value?.center);
  changed(state.location);
}

function changeLocation(newLocation) {
  state.usingGPS = false;
  state.location = newLocation;
  mapboxMapRef.value.jumpTo({
    center: state.location.geometry.coordinates,
  });
}

function reset() {
  changed(null);
  state.location = null;
  startGpsTimer();
}

function startGpsTimer() {
  mapboxGeolocateRef.value.trigger();
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
    location: state.usingGPS ? state.gpsLocation : geoJsonFromLngLat(mapboxMapRef.value?.center || [0, 0]),
    label: state.usingGPS ? 'Using GPS' : 'Using Map Center',
  };
});

const disablePick = computed(() => {
  return state.geolocationError && state.mapError;
});

function switchMapStyle() {
  const index = MAP_STYLES.indexOf(state.mapStyle);
  const newIndex = (index + 1) % MAP_STYLES.length;
  state.mapStyle = MAP_STYLES[newIndex];
}

watch(
  () => state.gpsLocation,
  async (value, prevValue) => {
    if (value) {
      stopGpsTimer();
    }

    if (!mapboxMapRef.value || !state.usingGPS) {
      return;
    }

    mapboxMapRef.value.stop();
    mapboxMapRef.value.jumpTo({ center: value.geometry.coordinates });
  },
  { deep: true }
);

watch(
  () => mapboxMapRef.value?.center,
  async (value, prevValue) => {
    console.error(value);
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
.map-container {
  position: relative;
  min-height: 300px;
  width: 100%;
  height: 50vh;
  max-height: 100%;
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

.gps-info {
  position: absolute;
  right: 10px;
  top: 122px;
  z-index: 1;
  display: block;
}

.layer-switch {
  position: absolute;
  right: 10px;
  top: 88px;
  z-index: 1;
}

.layer-switch.v-btn {
  min-width: unset;
  width: 29px;
  height: 29px;
  padding: 0;
}
</style>
