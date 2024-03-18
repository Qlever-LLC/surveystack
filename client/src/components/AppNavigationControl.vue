<template>
  <a-btn v-if="mobile" @click="forceMobileFullscreen = false" color="transparent" size="lg">
    <a-icon icon="mdi-arrow-left" />
  </a-btn>
  <a-btn v-else color="transparent" size="lg" @click="forceDesktopFullscreen = !forceDesktopFullscreen">
    <a-icon :icon="forceDesktopFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'" />
  </a-btn>
</template>
<script setup>
import { useDisplay } from 'vuetify';
import { useNavigation } from '@/components/navigation';

const { mobile } = useDisplay();
const { forceDesktopFullscreen, forceMobileFullscreen } = useNavigation();
</script>
