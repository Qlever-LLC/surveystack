<template>
  <div>
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
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
    <!-- <app-dialog v-model="isOpen.addFarm" width="300" @cancel="isOpen.addFarm = false" @confirm="isOpen.addFarm = false">
      <template #title>Add Farm Name</template>

      <v-text-field v-model="farmName" />
    </app-dialog> -->

    <div class="fields-table mt-6 d-none">
      <v-btn class="ml-auto" color="primary" @click="handleAddField">Add field</v-btn>
      <v-simple-table class="mt-2" height="300" fixed-header dense>
        <thead>
          <tr>
            <th class="text-left">Visible</th>
            <th class="text-left">Preview</th>
            <th class="text-left">Name</th>
            <th class="text-left">Type</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(field, i) in fields" :key="i">
            <td><v-switch v-model="fields[i].visible" class="my-3 pt-0" hide-details></v-switch></td>
            <td><img v-if="field.preview" height="48" :src="field.preview" /></td>
            <td><input v-model="fields[i].name" placeholder="Enter field name ..." /></td>
            <td><input v-model="fields[i].type" placeholder="Enter field type ..." /></td>
            <td align="right">
              <v-btn icon outlined small><v-icon>mdi-delete</v-icon></v-btn>
            </td>
          </tr>
        </tbody>
      </v-simple-table>
    </div>

    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlHint from '@/components/survey/drafts/ControlHint.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
import { MapInstanceManager } from '@our-sci/farmos-map';

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
export async function addDrawingLayer(map, value) {
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

  await map.addBehavior('edit', { layer });
  await map.addBehavior('measure', { layer });

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
      mapId: `farmos-map-${Math.floor(Math.random() * 1e4)}`,
      mapInstance: null,
      fields: [],
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
    new MapInstanceManager().destroy(this.mapId);
    this.mapInstance = null;
  },
  methods: {
    async load() {
      this.mapInstance = new MapInstanceManager().create(this.mapId);

      await addBaseLayer(this.mapInstance);
      await addDrawingLayer(this.mapInstance, this.value);

      const mapChangeHandler = (geojson) => this.changed(getNextValue(geojson));
      this.mapInstance.edit.geoJSONOn('featurechange', mapChangeHandler);
      this.mapInstance.edit.controlActivateOn('geotrace', (active) => {
        this.$store.dispatch('draft/setNextEnable', !active);
      });

      // If no features exist in value, run automatic behaviors
      if (!this.value) {
        this.mapInstance.attachBehavior({
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
    handleAddField() {
      this.fields.push({
        visible: true,
        preview: null,
        name: '',
        type: '',
        geojson: null,
      });
    },
  },
};
</script>

<style scoped src="./GeoJSON.css" />
