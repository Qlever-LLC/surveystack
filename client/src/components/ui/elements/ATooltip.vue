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

function getLocation() {
  if (props.bottom) {
    return 'bottom';
  }
  if (props.left) {
    return 'start';
  }
  if (props.right) {
    return 'end';
  }
  if (props.top) {
    return 'top';
  }
}
</script>
