<template>
  <a-row class="text-center">
    <template v-if="state === states.IDLE">
      <a-col cols="12">
        <app-kml-importer v-model="importedField" @change="onImport"></app-kml-importer>
      </a-col>
      <a-col cols="12"> OR </a-col>
      <a-col cols="12">
        <a-btn variant="outlined" color="primary" @click="draw">Draw new Field</a-btn>
      </a-col>
    </template>

    <template v-if="state === states.EDITING">
      <a-col cols="12">
        <app-farm-area
          ref="farm-area"
          :center="center"
          :value="value"
          @input="(val) => updateArea(val)"
        ></app-farm-area>
      </a-col>

      <a-col cols="6">
        <a-btn color="primary" @click="$emit('done')" :loading="loading">Add Field to FarmOS Instance</a-btn>
      </a-col>

      <a-col cols="6">
        <a-btn color="primary" variant="outlined" @click="$emit('cancel')" :loading="loading">Cancel</a-btn>
      </a-col>
    </template>

    <app-dialog labelConfirm="OK" class="text-primary mx-4" v-model="dialog" width="400"> Dialog Text </app-dialog>
  </a-row>
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
