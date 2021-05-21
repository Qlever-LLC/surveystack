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

  if (value) {
    map.zoomToLayer(layer);
  }

  map.addBehavior('edit', { layer });
  map.addBehavior('measure', { layer });
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
    load() {
      this.map = createMap({
        target: this.mapId,
        options: {},
      });

      addBaseLayer(this.map);
      addDrawingLayer(this.map, this.value);

      const mapChangeHandler = geojson => this.changed(getNextValue(geojson));
      this.map.edit.geoJSONOn('drawend', mapChangeHandler);
      this.map.edit.geoJSONOn('modifyend', mapChangeHandler);
      this.map.edit.geoJSONOn('translateend', mapChangeHandler);
      this.map.edit.geoJSONOn('delete', mapChangeHandler);
    },
  },
};
</script>

<style scoped src="./GeoJSON.css" />
