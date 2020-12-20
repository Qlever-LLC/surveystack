<template>
  <v-row>
    <v-col>
      <v-sheet outlined class="pa-8">
        <div class="display-1">KML Importer</div>
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


export default {
  components: {
    appDialog,
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

      // TODO import geojson and export WKT
      // see https://github.com/cschwarz/wkx
    },
    select() {
      const wktString = wkx.Geometry.parseGeoJSON(this.geojson);
      console.log('WKT', wktString);
    },
  },
};
</script>
