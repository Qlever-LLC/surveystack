<template>
  <div style="width: 100%">
    <v-form>
      <a-text-field @input="(val) => updateName(val)" :value="value.name" label="Name" placeholder="Name" outlined />
    </v-form>
    <div id="farmos-map" style="width: 100%; height: 500px"></div>
  </div>
</template>

<script>
import createMap from '@/external/instance/instance';
import ATextField from '@/components/ui/ATextField.vue';

export default {
  props: ['value', 'center'],
  components: {
    ATextField,
  },
  data() {
    return {
      layer: null,
      map: null,
    };
  },
  beforeDestroy() {
    if (this.map) {
      this.map.map.setTarget(null);
      this.map = null;
    }
  },
  methods: {
    updateName(v) {
      const { wkt } = this.value;
      this.$emit('input', {
        name: v,
        wkt,
      });
    },
    load() {
      const map = createMap({
        target: 'farmos-map',
        options: {},
      });
      this.map = map;

      // Adding an XYZ layer.
      const xyzOpts = {
        title: 'mapbox', // defaults to 'xyz'
        url: 'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoib3Vyc2NpIiwiYSI6ImNqb2ljdHMxYjA1bDAzcW03Zjd0cHBsbXMifQ.rL9QPLvi0kLP3DzLt1PQBA', // REQUIRED!
        visible: true, // defaults to true
        base: true, // defaults to false
      };
      map.addLayer('xyz', xyzOpts);

      console.log('created map', this.value);
      let layer;
      let wktOpts;
      if (this.value.wkt) {
        wktOpts = {
          title: 'field', // defaults to 'wkt'
          wkt: this.value.wkt, // REQUIRED!
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
      map.addBehavior('edit', { layer });
      map.addBehavior('measure', { layer });
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
        if (!this.value.wkt) {
          map.zoomToLayer(farmLayer);
        }
      }

      map.edit.wktOn('featurechange', (wkt) => {
        console.log('emitting change', wkt);
        this.$emit('input', {
          name: this.value.name,
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

<style>
/* Control color. */
.ol-control {
  background-color: rgba(255, 255, 255, 0.25);
}
.ol-control svg {
  fill: green;
}
.ol-control button {
  color: green;
  background-color: rgba(255, 255, 255, 0.8);
}
.ol-control button:hover,
.ol-control button:focus {
  background-color: rgba(255, 255, 255, 1);
}
.ol-scale-line {
  background: rgba(255, 255, 255, 0.25);
}

/* Control backgrounds. */
.ol-geocoder .gcd-gl-btn {
  background-image: none;
}
.ol-geocoder .gcd-gl-btn:after {
  content: '\1f50d';
}
.layer-switcher > button {
  background-size: 1.5em 1.5em;
}

/* Control sizing. */
.ol-control button,
.ol-geocoder .gcd-gl-btn {
  height: 1.75em;
  width: 1.75em;
}
.ol-geocoder .gcd-gl-control {
  width: 2.4em;
  height: 2.4em;
}
.ol-geocoder .gcd-gl-expanded {
  width: 16em;
  height: 2.4em;
}

/* Control positioning. */
.ol-geolocate.ol-control {
  left: 3.5em;
}
.ol-geocoder.gcd-gl-container {
  top: 0.5em;
  left: 6.5em;
}
.ol-geocoder .gcd-gl-input {
  left: 3em;
}
.ol-edit.ol-control {
  top: 5.5em;
}
.ol-rotate.ol-control {
  right: 3.5em;
}
.layer-switcher {
  top: 3.5em;
}
</style>
