import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

import AppGps from '@/components/ui/Gps.vue';
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

const MAP_STYLES = ['satellite', 'streets', 'outdoors'];

const geoJsonFromLngLat = ({ lng, lat }) => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [lng, lat],
  },
  properties: {
    accuracy: null,
  },
});

const geoJsonFromPosition = ({ coords }) => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [coords.longitude, coords.latitude],
  },
  properties: {
    accuracy: coords.accuracy,
  },
});

export default {
  mixins: [baseQuestionComponent],
  components: {
    AppGps,
  },
  data() {
    return {
      usingGPS: true,
      panel: [0],
      map: null,
      mapStyle: MAP_STYLES[0],
      marker: null,
      ctrl: null,
      mapError: false,
      location: null,
      gpsLocation: null,
      gpsTimer: 0,
      geolocationError: false,
    };
  },
  methods: {
    pickLocation() {
      this.location = this.usingGPS ? this.gpsLocation : geoJsonFromLngLat(this.map.getCenter());
      this.changed(this.location);

      if (!this.location || !this.map) {
        return;
      }

      if (this.marker) {
        this.marker.remove();
        this.marker = null;
      }

      this.marker = new mapboxgl.Marker()
        .setLngLat([this.location.geometry.coordinates[0], this.location.geometry.coordinates[1]])
        .addTo(this.map);
    },
    retake() {
      this.changed(null);
      if (this.marker) {
        this.marker.remove();
        this.marker = null;
      }
      this.location = null;
      this.ctrl.trigger();
    },
    switchMapStyle() {
      const index = MAP_STYLES.indexOf(this.mapStyle);
      const newIndex = (index + 1) % MAP_STYLES.length;
      this.mapStyle = MAP_STYLES[newIndex];
      this.map.setStyle(`mapbox://styles/mapbox/${this.mapStyle}-v9`);
    },
    startGpsTimer() {
      this.stopGpsTimer();
      this.gpsTimer = setTimeout(() => {
        console.warn('No confirmation from the user permission');
        this.geolocationError = 'No confirmation from the user permission';
        this.usingGPS = false;
      }, 30000);
    },
    stopGpsTimer() {
      if (!this.gpsTimer) {
        return;
      }

      clearTimeout(this.gpsTimer);
      this.gpsTimer = 0;
    },
    startMap() {
      this.map = new mapboxgl.Map({
        container: `map-question-${this.index}`,
        style: `mapbox://styles/mapbox/${this.mapStyle}-v9`,
        zoom: 15,
      });

      const geocoder = new MapboxGeocoder({
        // Initialize the geocoder
        accessToken: mapboxgl.accessToken, // Set the access token
        mapboxgl: this.map, // Set the mapbox-gl instance
        marker: false, // Do not use the default marker style
      });

      geocoder.on('result', () => {
        this.usingGPS = false;
      });

      document.getElementById(`map-question-geocoder-${this.index}`).appendChild(geocoder.onAdd(this.map));

      this.ctrl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      });

      this.ctrl.on('trackuserlocationstart', () => {
        this.startGpsTimer();
        this.usingGPS = true;
      });

      this.ctrl.on('geolocate', (position) => {
        this.stopGpsTimer();
        this.gpsLocation = geoJsonFromPosition(position);
      });

      this.map.addControl(this.ctrl);

      if (this.value) {
        this.marker = new mapboxgl.Marker().setLngLat(this.value.geometry.coordinates[0]).addTo(this.map);

        this.map.jumpTo({
          center: this.value.geometry.coordinates,
        });
      }

      this.map.on('load', () => {
        if (!this.value) {
          this.ctrl.trigger();
        }
        this.map.resize();
      });

      this.map.on('error', (err) => {
        console.log(err);
        this.mapError = true;
        this.usingGPS = true;
      });

      this.map.on('drag', () => {
        this.usingGPS = false;
      });
    },
  },
  computed: {
    currentLocation() {
      if (this.value) {
        return {
          location: this.value,
          // label: `used ${this.value.acc ? ' GPS' : 'Map Center'}`,
          label: `${this.value.properties ? 'Saved Location' : 'Current Map Center'}`,
        };
      }

      return {
        location: this.usingGPS ? this.gpsLocation : geoJsonFromLngLat(this.map.getCenter()),
        label: this.usingGPS ? 'Using GPS' : 'Using Map Center',
      };
    },
    disablePick() {
      return !this.gpsLocation || this.mapError;
    },
  },
  watch: {
    gpsLocation: {
      handler(val) {
        if (val) {
          this.stopGpsTimer();
        }

        if (!this.map || !this.usingGPS) {
          return;
        }

        this.map.stop();
        this.map.jumpTo({ center: val.geometry.coordinates });
      },
      deep: true,
    },
  },
  created() {
    mapboxgl.accessToken = 'pk.eyJ1Ijoib3Vyc2NpIiwiYSI6ImNqb2ljdHMxYjA1bDAzcW03Zjd0cHBsbXMifQ.rL9QPLvi0kLP3DzLt1PQBA';
    this.location = this.value;
  },
  mounted() {
    this.startMap();

    if (wakeLock in navigator) {
      requestWakeLock();
    }

    // TODO: this will now trigger a map error
  },
  beforeDestroy() {
    this.stopGpsTimer();
    this.map.remove();
  },
};
