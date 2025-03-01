<template>
  <div style="width: 100%">
    <a-form>
      <a-text-field
        :modelValue="modelValue.name"
        label="Name"
        placeholder="Name"
        variant="outlined"
        @update:modelValue="updateName($event)" />
    </a-form>
    <div id="farmos-map" style="width: 100%; height: 500px"></div>
  </div>
</template>

<script>
import { MapInstanceManager } from '@our-sci/farmos-map';

export default {
  props: ['modelValue', 'center'],
  emits: ['update:modelValue'],
  data() {
    return {
      layer: null,
      map: null,
    };
  },
  beforeUnmount() {
    if (this.map) {
      this.map.map.setTarget(null);
      this.map = null;
    }
  },
  methods: {
    updateName(v) {
      const { wkt } = this.modelValue;
      this.$emit('update:modelValue', {
        name: v,
        wkt,
      });
    },
    async load() {
      const map = new MapInstanceManager().create('farmos-map', {});
      this.map = map;

      // Adding an XYZ layer.
      const xyzOpts = {
        title: 'mapbox', // defaults to 'xyz'
        url: 'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoib3Vyc2NpIiwiYSI6ImNqb2ljdHMxYjA1bDAzcW03Zjd0cHBsbXMifQ.rL9QPLvi0kLP3DzLt1PQBA', // REQUIRED!
        visible: true, // defaults to true
        base: true, // defaults to false
      };
      map.addLayer('xyz', xyzOpts);

      console.log('created map', this.modelValue);
      let layer;
      let wktOpts;
      if (this.modelValue.wkt) {
        wktOpts = {
          title: 'field', // defaults to 'wkt'
          wkt: this.modelValue.wkt, // REQUIRED!
          color: 'orange', // defaults to 'orange'
          visible: true, // defaults to true
        };
        layer = map.addLayer('wkt', wktOpts);
      } else {
        const vopts = {
          title: 'field', // defaults to 'wkt'
          color: 'orange', // defaults to 'orange'
          visible: true, // defaults to true,
        };
        layer = map.addLayer('vector', vopts);
      }
      await map.addBehavior('edit', { layer });
      await map.addBehavior('measure', { layer });
      this.layer = layer;
      map.zoomToLayer(layer);

      if (this.center) {
        wktOpts = {
          title: 'Farm', // defaults to 'wkt'
          color: 'blue', // defaults to 'orange'
          visible: true, // defaults to true
          wkt: this.center,
        };
        const farmLayer = map.addLayer('wkt', wktOpts);
        if (!this.modelValue.wkt) {
          map.zoomToLayer(farmLayer);
        }
      }

      map.edit.wktOn('featurechange', (wkt) => {
        console.log('emitting change', wkt);
        this.$emit('update:modelValue', {
          name: this.modelValue.name,
          wkt,
        });
      });
    },
    clear() {
      this.map.map.setTarget(null);
      this.map = null;
      this.load();
    },
  },
  mounted() {
    this.load();
  },
};
</script>
