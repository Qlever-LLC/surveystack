<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      :is-modified="meta && meta.dateModified"
      @initialize="initialize"
    />
    <app-control-hint :value="control.hint" />
    <div
      :id="mapId"
      :class="{
        map: true,
        'hide-polygon': !control.options.geoJSON.showPolygon,
        'hide-line': !control.options.geoJSON.showLine,
        'hide-point': !control.options.geoJSON.showPoint,
        'hide-circle': !control.options.geoJSON.showCircle,
        'hide-move': !hasSomeDrawControl,
        'hide-modify': !hasSomeDrawControl,
      }"
      role="application"
    />
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import createMap from '@/external/instance/instance';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlHint from '@/components/survey/drafts/ControlHint.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';

/**
 * Add base tile layer to map
 */
export function addBaseLayer(map) {
  const xyzOpts = {
    title: 'mapbox',
    url: 'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoib3Vyc2NpIiwiYSI6ImNqb2ljdHMxYjA1bDAzcW03Zjd0cHBsbXMifQ.rL9QPLvi0kLP3DzLt1PQBA',
    visible: true,
    base: true,
  };
  return map.addLayer('xyz', xyzOpts);
}

/**
 * Add drawing layer to OpenLayers map
 * @param {ol.Map} map
 * @param {string|undefined|null} value: stringified geojson used to initialize drawing layer
 * @returns {ol.Layer} drawing layer created
 */
export function addDrawingLayer(map, value) {
  const opts = {
    title: 'features',
    ...(value && { geojson: JSON.stringify(value) }),
    color: 'blue',
    visible: true,
  };
  const layerType = value ? 'geojson' : 'vector';
  const layer = map.addLayer(layerType, opts);

  if (value) {
    map.zoomToLayer(layer);
  }

  map.addBehavior('edit', { layer });
  map.addBehavior('measure', { layer });
  return layer;
}

/**
 * Calculate the next value to assign to component's `this.value`
 * @param {string} geojson: stringified geojson FeatureCollection emitted from map
 * @returns {string|null} next value to assign to components `this.value`
 */
export function getNextValue(geojson) {
  const parsedGeoJSON = geojson && JSON.parse(geojson);
  const geojsonIsEmpty = geojson && parsedGeoJSON.features && parsedGeoJSON.features.length === 0;
  return geojsonIsEmpty ? null : parsedGeoJSON;
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
  computed: {
    hasSomeDrawControl() {
      const { showPolygon, showLine, showCircle, showPoint } = this.control.options.geoJSON;
      return showPolygon || showLine || showCircle || showPoint;
    },
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

      const mapChangeHandler = (geojson) => this.changed(getNextValue(geojson));
      this.map.edit.geoJSONOn('drawend', mapChangeHandler);
      this.map.edit.geoJSONOn('modifyend', mapChangeHandler);
      this.map.edit.geoJSONOn('translateend', mapChangeHandler);
      this.map.edit.geoJSONOn('delete', mapChangeHandler);

      // If no features exist in value, run automatic behaviors
      if (!this.value) {
        this.map.attachBehavior({
          attach(instance) {
            const controls = instance.map.getControls().getArray();
            const geolocateControl = controls && controls.find((control) => control.constructor.name === 'Geolocate');
            if (geolocateControl) {
              // Trigger geolocation
              geolocateControl.activate();
            }
          },
        });

        // Autofocus geocoder for desktop
        if (window.innerWidth > 600) {
          document.querySelector('#gcd-button-control').click();
          document.querySelector('#gcd-input-query').focus();
        }
      }
    },
  },
};
</script>

<style scoped src="./GeoJSON.css" />
