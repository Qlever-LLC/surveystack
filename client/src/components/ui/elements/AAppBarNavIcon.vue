<template>
  <v-app-bar-nav-icon @click="$emit('click', $event)" />
</template>

<script>
export default {
  emits: ['click'],
};
</script>
