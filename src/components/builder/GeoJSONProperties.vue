<template>
  <div>
    <div class="text--primary">
      Map Options
    </div>
    <v-checkbox
      v-for="opt in options"
      :key="opt.key"
      class="my-1"
      outlined
      v-model="value[opt.key]"
      :label="opt.text"
      color="grey darken-1"
      hide-details
    />
  </div>
</template>

<script>
export const options = [
  {
    key: 'showPolygon',
    text: 'Show polygon control',
  },
  {
    key: 'showLine',
    text: 'Show line control',
  },
  {
    key: 'showPoint',
    text: 'Show point control',
  },
  {
    key: 'showCircle',
    text: 'Show circle control',
  },
  {
    key: 'showModify',
    text: 'Show modify control',
  },
  {
    key: 'showMove',
    text: 'Show move control',
  },
];

export default {
  name: 'geojson-properties',
  data() {
    return {
      options,
    };
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style>

</style>
