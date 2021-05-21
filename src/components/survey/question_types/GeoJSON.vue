<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
    />
    <app-control-hint :value="control.hint" />
    <div
      :id="mapId"
      :class="{
        'map': true,
        'hide-polygon': !control.options.geoJSON.showPolygon,
        'hide-line': !control.options.geoJSON.showLine,
        'hide-point': !control.options.geoJSON.showPoint,
        'hide-circle': !control.options.geoJSON.showCircle,
        'hide-move': !control.options.geoJSON.showMove,
        'hide-modify': !control.options.geoJSON.showModify,
      }"
      role="application"
    />
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
// import 'ol/ol.css';
import baseQuestionComponent from './BaseQuestionComponent';
import createMap from '@/external/instance/instance';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlHint from '@/components/survey/drafts/ControlHint.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';

export function addBaseLayer(map) {
  // Adding an XYZ layer.
  const xyzOpts = {
    title: 'mapbox',
    url: 'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoib3Vyc2NpIiwiYSI6ImNqb2ljdHMxYjA1bDAzcW03Zjd0cHBsbXMifQ.rL9QPLvi0kLP3DzLt1PQBA',
    visible: true,
    base: true,
  };
  const xyzLayer = map.addLayer('xyz', xyzOpts);
}

export function addDrawingLayer(map, value) {
  const opts = {
    title: 'features',
    ...(value && { geojson: value }),
    color: 'blue',
    visible: true,
  };
  const layer = map.addLayer('vector', opts);
  map.zoomToLayer(layer);

  map.addBehavior('edit', { layer });
  map.addBehavior('measure', { layer });
  map.zoomToLayer(layer);
  return layer;
}

export function getNextValue(geojson) {
  const geojsonIsEmpty = geojson && geojson.features && geojson.features.length === 0;
  return geojsonIsEmpty ? null : geojson;
}

export default {
  mixins: [baseQuestionComponent],
  components: {
    appControlLabel,
    appControlHint,
    appControlMoreInfo,
  },
  data() {
    return {
      layer: null,
      map: null,
      mapId: `farmos-map-${Math.floor(Math.random() * 1e4)}`,
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

      addBaseLayer(map);
      this.layer = addDrawingLayer(map, this.value);

      // let layer;
      // if (this.value) {
      //   const vopts = {
      //     title: 'features',
      //     geojson: this.value,
      //     color: 'blue',
      //     visible: true,
      //   };
      //   layer = map.addLayer('geojson', vopts);
      // } else {
      //   const vopts = {
      //     title: 'features',
      //     color: 'blue',
      //     visible: true,
      //   };
      //   layer = map.addLayer('vector', vopts);
      // }
      // map.addBehavior('edit', { layer });
      // map.addBehavior('measure', { layer });
      // this.layer = layer;

      // let layer;
      // let wktOpts;
      // if (this.value && this.value) {
      //   // wktOpts = {
      //   //   title: 'vectors', // defaults to 'wkt'
      //   //   geojson: this.value,
      //   //   color: 'orange', // defaults to 'orange'
      //   //   visible: true, // defaults to true
      //   // };
      //   // layer = map.addLayer('geojson', wktOpts);
      // } else {
      //   const vopts = {
      //     title: 'field', // defaults to 'wkt'
      //     color: 'orange', // defaults to 'orange'
      //     visible: true, // defaults to true,
      //   };
      //   // layer = map.addLayer('vector', vopts);
      //   map.
      // }
      // map.addBehavior('edit', { layer });
      // map.addBehavior('measure', { layer });

      // const wkt = 'POLYGON ((-75.53643733263014 42.54424760416683, -75.5360350012779 42.54427527000766, -75.53589016199109 42.54412508386721, -75.53588747978209 42.54302634269183, -75.53643733263014 42.54424760416683))';
      // const wktOpts = {
      //   title: 'my-polygon', // defaults to 'wkt'
      //   wkt, // REQUIRED!
      //   color: 'orange', // defaults to 'orange'
      //   visible: true, // defaults to true
      // };
      // const wktLayer = map.addLayer('wkt', wktOpts);

      // this.layer = layer;
      // map.zoomToLayer(layer);

      const mapChangeHandler = geojson => this.changed(getNextValue(geojson));
      map.edit.geoJSONOn('drawend', mapChangeHandler);
      map.edit.geoJSONOn('modifyend', mapChangeHandler);
      map.edit.geoJSONOn('translateend', mapChangeHandler);
      map.edit.geoJSONOn('delete', mapChangeHandler);
    },
  },
};

export function hello() {
  console.log('asdf');
}
</script>


<style src="./GeoJSON.css" />
