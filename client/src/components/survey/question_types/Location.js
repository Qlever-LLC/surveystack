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

export default {
  mixins: [baseQuestionComponent],
  components: {
    AppGps,
  },
  data() {
    return {
      panel: [0],
      map: null,
      mapError: false,
      geolocationError: false,
      first: true,
      location: null,
      gps: null,
      geolocationID: null,
      usingGPS: true,
      marker: null,
      ctrl: null,
      mapStyle: MAP_STYLES[0],
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

      if (this.location) {
        this.marker = new mapboxgl.Marker()
          .setLngLat([this.location.geometry.coordinates[0], this.location.geometry.coordinates[1]])
          .addTo(this.map);
      }
    },
    retake() {
      this.changed(null);
      if (this.marker) {
        this.marker.remove();
      }
      this.location = null;
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

      const geocoder = new MapboxGeocoder({
        // Initialize the geocoder
        accessToken: mapboxgl.accessToken, // Set the access token
        mapboxgl: map, // Set the mapbox-gl instance
        marker: false, // Do not use the default marker style
      });

      geocoder.on('result', () => {
        this.usingGPS = false;
      });

      // Add the geocoder above the map
      // document.getElementById('geocoder').appendChild(geocoder.onAdd(map));
      document.getElementById(`map-question-geocoder-${this.index}`).appendChild(geocoder.onAdd(map));

      map.on('error', (err) => {
        console.log(err);
        this.mapError = true;
        this.usingGPS = true;
      });

      map.on('drag', () => {
        this.usingGPS = false;
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
        this.marker = new mapboxgl.Marker()
          .setLngLat([value.geometry.coordinates[0], value.geometry.coordinates[1]])
          .addTo(map);

        map.jumpTo({
          center: [value.geometry.coordinates[0], value.geometry.coordinates[1]],
        });
      }
    },
    switchMapStyle() {
      const index = MAP_STYLES.indexOf(this.mapStyle);
      const newIndex = (index + 1) % MAP_STYLES.length;
      this.mapStyle = MAP_STYLES[newIndex];
      this.map.setStyle(`mapbox://styles/mapbox/${this.mapStyle}-v9`);
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
        location: this.usingGPS ? this.gps : this.geoJsonFromLngLat(this.map.getCenter()),
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
    setTimeout(() => {}, 2000);

    mapboxgl.accessToken = 'pk.eyJ1Ijoib3Vyc2NpIiwiYSI6ImNqb2ljdHMxYjA1bDAzcW03Zjd0cHBsbXMifQ.rL9QPLvi0kLP3DzLt1PQBA';
    this.map = new mapboxgl.Map({
      container: `map-question-${this.index}`,
      style: `mapbox://styles/mapbox/${this.mapStyle}-v9`,
      // center: [8.311068, 47.462507],
      zoom: 15,
    });

    this.handleMap(this.map, this.value);

    if (wakeLock in navigator) {
      requestWakeLock();
    }

    const successHandler = (position) => {
      this.gps = this.geoJsonFromPosition(position);
    };
    const errorHandler = (err) => {
      console.warn(`Error (${err.code}): ${err.message}`);
      this.geolocationError = err;
    };

    // TODO: this will now trigger a map error
    if (navigator.geolocation) {
      this.geolocationID = navigator.geolocation.watchPosition(successHandler, errorHandler);
    }
  },
  beforeDestroy() {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(this.geolocationID);
    }
    this.map.remove();
  },
};
