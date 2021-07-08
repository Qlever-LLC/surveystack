<template>
  <v-row class="text-center">
    <template v-if="state === states.IDLE">
      <v-col cols="12">
        <app-kml-importer v-model="importedField" @change="onImport"></app-kml-importer>
      </v-col>
      <v-col cols="12"> OR </v-col>
      <v-col cols="12">
        <v-btn outlined color="primary" @click="draw">Draw new Field</v-btn>
      </v-col>
    </template>

    <template v-if="state === states.EDITING">
      <v-col cols="12">
        <app-farm-area
          ref="farm-area"
          :center="center"
          :value="value"
          @input="(val) => updateArea(val)"
        ></app-farm-area>
      </v-col>

      <v-col cols="6">
        <v-btn color="primary" @click="$emit('done')" :loading="loading">Add Field to FarmOS Instance</v-btn>
      </v-col>

      <v-col cols="6">
        <v-btn color="primary" outlined @click="$emit('cancel')" :loading="loading">Cancel</v-btn>
      </v-col>
    </template>

    <app-dialog labelConfirm="OK" class="primary--text mx-4" v-model="dialog" width="400">
      Dialog Text
    </app-dialog>
  </v-row>
</template>
<script>
import appDialog from '@/components/ui/Dialog.vue';
import appFarmArea from './FarmOSArea.vue';
import appKmlImporter from './KmlImporter.vue';

const states = {
  IDLE: 0,
  EDITING: 1,
  DONE: 2,
};

Object.freeze(states);

export default {
  components: {
    appDialog,
    appFarmArea,
    appKmlImporter,
  },
  props: ['value', 'center', 'loading'],
  data() {
    return {
      states,
      state: states.IDLE,
      importedField: {
        wkt: null,
        name: null,
      },
      dialog: false,
    };
  },
  methods: {
    clear() {
      this.state = states.IDLE;
      if (this.$refs['farm-area']) {
        this.$refs['farm-area'].clear();
      }
    },
    updateArea(value) {
      this.$emit('input', value);
    },
    onImport() {
      this.$emit('input', {
        name: this.importedField.name,
        wkt: this.importedField.wkt,
      });

      console.log('imported', this.value);

      this.state = states.EDITING;
    },
    draw() {
      this.$emit('input', {
        name: 'New Field',
        wkt: null,
      });
      this.state = states.EDITING;
    },
  },
};
</script>
