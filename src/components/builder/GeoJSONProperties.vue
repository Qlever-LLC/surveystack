<template>
  <div>
    <v-checkbox
      class="my-1"
      outlined
      v-model="value.showPolygon"
      label="Show polygon control"
      color="grey darken-1"
      hide-details
    >
      <template slot="label">
      <div>
        <div class="text--primary">Show polygon control</div>
        <!-- <div class="body-2">Make this a required field</div> -->
      </div>
      </template>
    </v-checkbox>
    <v-checkbox
      class="my-1"
      outlined
      v-model="value.showLine"
      label="Show polygon control"
      color="grey darken-1"
      hide-details
    >
      <template slot="label">
      <div>
        <div class="text--primary">Show line control</div>
        <!-- <div class="body-2">Make this a required field</div> -->
      </div>
      </template>
    </v-checkbox>
    <v-checkbox
      class="my-1"
      outlined
      v-model="value.showPoint"
      label="Show polygon control"
      color="grey darken-1"
      hide-details
    >
      <template slot="label">
      <div>
        <div class="text--primary">Show point control</div>
        <!-- <div class="body-2">Make this a required field</div> -->
      </div>
      </template>
    </v-checkbox>
    <v-checkbox
      class="my-1"
      outlined
      v-model="value.showCircle"
      label="Show polygon control"
      color="grey darken-1"
      hide-details
    >
      <template slot="label">
      <div>
        <div class="text--primary">Show circle control</div>
        <!-- <div class="body-2">Make this a required field</div> -->
      </div>
      </template>
    </v-checkbox>
    <v-checkbox
      class="my-1"
      outlined
      v-model="value.showModify"
      label="Show modify control"
      color="grey darken-1"
      hide-details
    >
      <template slot="label">
      <div>
        <div class="text--primary">Show modify control</div>
        <!-- <div class="body-2">Make this a required field</div> -->
      </div>
      </template>
    </v-checkbox>
    <v-checkbox
      class="my-1"
      outlined
      v-model="value.showMove"
      label="Show move control"
      color="grey darken-1"
      hide-details
    >
      <template slot="label">
      <div>
        <div class="text--primary">Show move control</div>
        <!-- <div class="body-2">Make this a required field</div> -->
      </div>
      </template>
    </v-checkbox>
  </div>
</template>

<script>
export default {
  name: 'geojson-properties',
  props: {
    value: {
      type: Object,
      required: true,
    },
  },
  mounted() {
    if (this.value === null) {
      this.$emit('input', {});
    }
  },
};
</script>

<style>

</style>
