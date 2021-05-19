<template>
    <div class="full-width">
        <div
          :id="mapId"
          :class="{
            'hide-polygon': !control.options.geoJSON.showPolygon,
            'hide-line': !control.options.geoJSON.showLine,
            'hide-point': !control.options.geoJSON.showPoint,
            'hide-circle': !control.options.geoJSON.showCircle,
            'hide-move': !control.options.geoJSON.showMove,
            'hide-modify': !control.options.geoJSON.showModify,
          }"
          style="width: 100%; height: 500px"
        />
    </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import createMap from '@/external/instance/instance';
// function createMap() { return {}; }


export default {
  mixins: [baseQuestionComponent],
  data() {
    return {
      layer: null,
      map: null,
      mapId: `farmos-map-${Math.floor(Math.random() * 1e3)}`,
    };
  },
  mounted() {
    this.load();
  },
  beforeDestroy() {
    if (this.map) {
      this.map.map.setTarget(null);
      this.map = null;
    }
  },
  methods: {
    updateName(v) {
      const { wkt } = this.value;
      this.$emit('input', {
        name: v,
        wkt,
      });
    },
    load() {
      const map = createMap({
        target: this.mapId,
        options: {},
      });
      this.map = map;

      // Adding an XYZ layer.
      const xyzOpts = {
        title: 'mapbox', // defaults to 'xyz'
        url: 'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoib3Vyc2NpIiwiYSI6ImNqb2ljdHMxYjA1bDAzcW03Zjd0cHBsbXMifQ.rL9QPLvi0kLP3DzLt1PQBA', // REQUIRED!
        visible: true, // defaults to true
        base: true, // defaults to false
      };
      const xyzLayer = map.addLayer('xyz', xyzOpts);

      console.log('created map', this.value);
      let layer;
      let wktOpts;
      if (this.value && this.value) {
        wktOpts = {
          title: 'vectors', // defaults to 'wkt'
          geojson: this.value,
          color: 'orange', // defaults to 'orange'
          visible: true, // defaults to true
        };
        layer = map.addLayer('geojson', wktOpts);
      } else {
        const vopts = {
          title: 'field', // defaults to 'wkt'
          color: 'orange', // defaults to 'orange'
          visible: true, // defaults to true,
        };
        layer = map.addLayer('vector', vopts);
      }
      map.addBehavior('edit', { layer });
      map.addBehavior('measure', { layer });
      this.layer = layer;
      map.zoomToLayer(layer);

      const mapChangeHandler = (geojson) => {
        this.changed(geojson);
        // Reset question value to null if geojson feature collection is empty
        // This ensures that question's required flag will work correctly
        if (geojson && geojson.features && geojson.features.length === 0) {
          this.changed(null);
        }
      };

      map.edit.geoJSONOn('drawend', mapChangeHandler);
      map.edit.geoJSONOn('modifyend', mapChangeHandler);
      map.edit.geoJSONOn('translateend', mapChangeHandler);
      map.edit.geoJSONOn('delete', mapChangeHandler);
    },
  },
};
</script>

<style>
/* Control color. */
.ol-control {
  background-color: rgba(255, 255, 255, 0.25);
}
.ol-control svg {
  fill: green;
}
.ol-control button {
  color: green;
  background-color: rgba(255, 255, 255, 0.8);
}
.ol-control button:hover,
.ol-control button:focus {
  background-color: rgba(255, 255, 255, 1);
}
.ol-scale-line {
  background: rgba(255, 255, 255, 0.25);
}

/* Control backgrounds. */
.ol-geocoder .gcd-gl-btn {
  background-image: none;
}
.ol-geocoder .gcd-gl-btn:after {
  content: "\1f50d";
}
.layer-switcher > button {
  background-size: 1.5em 1.5em;
}

/* Control sizing. */
.ol-control button,
.ol-geocoder .gcd-gl-btn {
  height: 1.75em;
  width: 1.75em;
}
.ol-geocoder .gcd-gl-control {
  width: 2.4em;
  height: 2.4em;
}
.ol-geocoder .gcd-gl-expanded {
  width: 16em;
  height: 2.4em;
}

/* Control positioning. */
.ol-geolocate.ol-control {
  left: 3.5em;
}
.ol-geocoder.gcd-gl-container {
  top: 0.5em;
  left: 6.5em;
}
.ol-geocoder .gcd-gl-input {
  left: 3em;
}
.ol-edit.ol-control {
  top: 5.5em;
}
.ol-rotate.ol-control {
  right: 3.5em;
}
.layer-switcher {
  top: 3.5em;
}

.layer-switcher ul {
  /* margin: 0; */
}

.layer-switcher ul li {
  display: flex;
  align-items: center;
}


.hide-polygon .ol-edit-polygon,
.hide-point .ol-edit-point,
.hide-line .ol-edit-line,
.hide-circle .ol-edit-circle,
.hide-modify .ol-edit-modify,
.hide-move .ol-edit-move {
  display: none;
}
</style>
