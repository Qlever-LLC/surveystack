<template>
  <a-sheet outlined class="pa-8">
    <div class="display-1">
      KML Importer
      <a-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <a-icon color="primary" v-bind="attrs" v-on="on">mdi-information</a-icon>
        </template>
        <span>
          Upload KML File. Note that KML Files may come as .kmz Files. Be sure to extract the .kml from the .kmz first.
        </span>
      </a-tooltip>
    </div>
    <!-- TODO add small piece of info describing that kml often come in kmz -->

    <a-row>
      <a-file-input label="Upload KML file" @change="getFile" />
    </a-row>
    <template v-if="kml !== ''">
      <a-row>
        <a-select
          v-model="field"
          :items="fields"
          item-title="text"
          item-value="value"
          variant="outlined"
          label="Select Field"
          @update:modelValue="selected"
        />
      </a-row>
      <a-row class="text-center">
        <a-col><a-btn @click="$emit('change')" color="primary">Import</a-btn></a-col>
      </a-row>
    </template>
  </a-sheet>
</template>
<script>
import togeojson from '@mapbox/togeojson';
import wkx from 'wkx';

export default {
  props: ['modelValue'],
  data() {
    return {
      kml: '', // string of KML
      dialog: null,
      wkt: null,
      geojson: {},
      fields: [],
      field: null,
      name: '',
      value: this.modelValue,
    };
  },
  methods: {
    importKml() {
      console.log('importing');
      const dom = new DOMParser().parseFromString(this.kml, 'text/xml');
      const geojson = togeojson.kml(dom);
      console.log('imported geojson', geojson);
      this.geojson = geojson;

      // TODO import geojson and export WKT
      // see https://github.com/cschwarz/wkx
    },
    selected() {
      const wktString = wkx.Geometry.parseGeoJSON(this.field.geometry);
      console.log('WKT', wktString);
      this.wkt = wktString.toWkt();
      this.name = (this.field && this.field.properties && this.field.properties.name) || '';

      this.$emit('input', {
        name: this.name,
        wkt: this.wkt,
      });
      console.log(wktString);
    },
    async getFile(files) {
      const e = files[0];
      if (!e) {
        return;
      }
      const holder = await e.text();
      this.kml = holder;
      this.importKml();
      this.fields = this.geojson.features.map((el) => ({
        name: el.properties.name,
        text: el.properties.name,
        value: el,
      }));
    },
  },
};
</script>
