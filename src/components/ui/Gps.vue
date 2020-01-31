<template>
  <v-card
    dark
    color="gray"
    class="mono"
  >
    <slot></slot>
    <br>lat: {{ location.lat.toFixed(7) }}
    <br>lng: {{ location.lng.toFixed(7) }}
    <template v-if="location.acc"><br>acc: {{ location.acc.toFixed(2) }}</template>
  </v-card>
</template>

<script>
export default {
  props: [
    'location',
  ],
};
</script>
