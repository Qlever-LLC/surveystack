<template>
  <div style="width: 100%">
    <v-form>
      <v-text-field
        v-model="area.name"
        label="Name"
        placeholder="Name"
        outlined
      />

    </v-form>
    <div
      id="farmos-map"
      style="width: 100%; height: 500px"
    ></div>
  </div>
</template>

<script>
import createMap from '@/external/instance/instance';


export default {
  props: [
    'area',
  ],
  mounted() {
    const map = createMap({
      target: 'farmos-map',
      options: {

      },
    });
    const drawingLayer = map.addLayer('vector');
    map.addBehavior('edit', { layer: drawingLayer });
    map.addBehavior('measure', { layer: drawingLayer });


    console.log('created map');
  },
};
</script>

<style>
</style>
