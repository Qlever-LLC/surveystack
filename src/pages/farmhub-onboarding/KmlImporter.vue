<template>
  <v-sheet outlined class="pa-8">
    <div class="display-1">
      KML Importer
      <app-tooltip
        >Upload KML File. Note that KML Files may come as .kmz Files. Be sure to extract the .kml from the .kmz
        first.</app-tooltip
      >
    </div>
    <!-- TODO add small piece of info describing that kml often come in kmz -->

    <v-row>
      <v-file-input label="Upload KML file" @change="getFile"></v-file-input>
    </v-row>
    <template v-if="kml !== ''">
      <v-row>
        <v-autocomplete
          v-model="field"
          :items="fields"
          outlined
          label="Select Field"
          @change="selected"
        ></v-autocomplete>
      </v-row>
      <v-row class="text-center">
        <v-col><v-btn @click="$emit('change')" color="primary">Import</v-btn></v-col>
      </v-row>
    </template>
  </v-sheet>
</template>
<script>
import togeojson from '@mapbox/togeojson';
import wkx from 'wkx';

import appTooltip from '@/components/ui/Tooltip.vue';

export default {
  components: {
    appTooltip,
  },
  props: ['value'],
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

      this.$emit('input', {
        name: this.name,
        wkt: this.wkt,
      });
      console.log(wktString);
    },
    async getFile(e) {
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
