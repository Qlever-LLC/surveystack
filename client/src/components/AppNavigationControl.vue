<template>
  <a-btn v-if="mobile" @click="forceMobileFullscreen = false" size="md" icon variant="elevated" :rounded="0">
    <a-icon icon="mdi-arrow-left" />
  </a-btn>
  <a-btn
    v-else
    size="md"
    icon
    @click="forceDesktopFullscreen = !forceDesktopFullscreen"
    variant="elevated"
    :rounded="0">
    <a-icon :icon="forceDesktopFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'" />
  </a-btn>
</template>
<script setup>
import { useDisplay } from 'vuetify';
import { useNavigation } from '@/components/navigation';

const { mobile } = useDisplay();
const { forceDesktopFullscreen, forceMobileFullscreen } = useNavigation();
</script>
