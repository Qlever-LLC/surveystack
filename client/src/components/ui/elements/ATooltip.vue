<template>
  <v-tooltip
    :disabled="disabled"
    :location="getLocation()"
    :max-width="maxWidth"
    :open-delay="openDelay"
    :transition="transition">
    <template v-slot:activator="{ props }">
      <slot name="activator" :props="props"></slot>
    </template>
    <slot />
  </v-tooltip>
</template>

<script setup>
import { reactive } from 'vue';

const props = defineProps({
  // //vuetify props
  bottom: { type: Boolean, required: false },
  disabled: { type: Boolean, required: false },
  left: { type: Boolean, required: false },
  maxWidth: { type: [Number, String], required: false },
  openDelay: { type: [Number, String], required: false },
  right: { type: Boolean, required: false },
  top: { type: Boolean, required: false },
  transition: { type: String, required: false },
});

const state = reactive({
  location: undefined,
});

function getLocation() {
  if (props.bottom) {
    return (state.location = 'bottom');
  }
  if (props.left) {
    return (state.location = 'start');
  }
  if (props.right) {
    return (state.location = 'end');
  }
  if (props.top) {
    return (state.location = 'top');
  }
}
</script>
