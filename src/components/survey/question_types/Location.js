import mapboxgl from 'mapbox-gl';
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
    geoJsonFromLngLat({
      lng,
      lat,
    }) {
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
    geoJsonFromPosition({
      coords,
    }) {
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
          label: `${this.value.properties ? 'Saved Location' : 'Current Map Center'}`,
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
