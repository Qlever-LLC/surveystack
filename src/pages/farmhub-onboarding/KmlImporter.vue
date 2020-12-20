<template>
  <v-row>
    <v-col>
      <v-sheet outlined class="pa-8">
        <div class="display-1">KML Importer</div>
        <v-row>
          <v-file-input
            label="Upload klm file"
            @change="getFile"
          ></v-file-input>
        </v-row>
        <v-row v-if="kml !== ''">
          <v-autocomplete
              v-model="farm"
              :items="selectArr"
              outlined
              label="Select farm"
              @change="select"
            ></v-autocomplete>
        </v-row>
        <v-row>
          <app-farm-area
            v-if="wkt"
            :farm="farm"
            :area="wkt"
          ></app-farm-area>
        </v-row>
      </v-sheet>
    </v-col>

    <app-dialog
      labelConfirm="OK"
      class="primary--text mx-4"
      v-model="dialog"
      @cancel="cancel"
      @confirm="confirm"
      width="400"
    >
      Dialog Text
    </app-dialog>
  </v-row>
</template>
<script>

import togeojson from '@mapbox/togeojson';
import wkx from 'wkx';
import appDialog from '@/components/ui/Dialog.vue';
import farmArea from './FarmOSArea.vue';


export default {
  components: {
    appDialog,
    appFarmArea: farmArea,
  },
  props: [
    'value',
  ],
  data() {
    return {
      kml: '', // string of KML
      dialog: null,
      wkt: '',
      geojson: {},
      selectArr: [],
      farm: null,
    };
  },
  methods: {
    confirm() {
      // TODO emit after picking field
      this.value = this.wkt;
      this.$emit('chosen');
    },
    cancel() {
      // TODO cancel selection
    },
    importKml() {
      console.log('importing');
      const dom = (new DOMParser()).parseFromString(this.kml, 'text/xml');
      const geojson = togeojson.kml(dom);
      console.log('imported geojson', geojson);
      this.geojson = geojson;

      // TODO import geojson and export WKT
      // see https://github.com/cschwarz/wkx
    },
    select() {
      const wktString = wkx.Geometry.parseGeoJSON(this.farm.geometry);
      console.log('WKT', wktString);
      this.wkt = wktString.toWkt();
      // console.log(wktString);
    },
    async getFile(e) {
      const holder = await e.text();
      this.kml = holder;
      this.importKml();
      this.selectArr = this.geojson.features.map(el => ({
        name: el.properties.name,
        text: el.properties.name,
        value: el,
      }));
    },
  },
};
</script>
