<template>
  <a-sheet :border="true" class="pa-8">
    <div class="text-h5">
      KML Importer
      <a-btn color="primary" icon>
        <a-icon class="mr-1">mdi-information</a-icon>
        <a-tooltip activator="parent">
          Upload KML File. Note that KML Files may come as .kmz Files. Be sure to extract the .kml from the .kmz irst.
        </a-tooltip>
      </a-btn>
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
          @update:modelValue="selected" />
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
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      kml: '', // string of KML
      dialog: null,
      wkt: null,
      geojson: {},
      fields: [],
      field: null,
      name: '',
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

      this.$emit('update:modelValue', {
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
