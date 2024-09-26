<template>
  <v-app-bar-nav-icon @click="$emit('click', $event)">
    <slot />
  </v-app-bar-nav-icon>
</template>

<script>
export default {
  emits: ['click'],
};
</script>
