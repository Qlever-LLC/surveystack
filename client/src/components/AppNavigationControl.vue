<template>
  <a-btn v-if="mobile" @click="handleClick" size="md" icon variant="elevated" :rounded="0">
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
import { useRouter } from 'vue-router';
import { useNavigation } from '@/components/navigation';
import { useGroup } from '@/components/groups/group';

const { mobile } = useDisplay();
const { forceDesktopFullscreen, forceMobileFullscreen } = useNavigation();
const router = useRouter();
const { getActiveGroupId } = useGroup();

function handleClick() {
  const url = window.location.pathname;

  const regex = /^\/groups\/[a-fA-F0-9]{24}\/surveys\/[a-fA-F0-9]{24}\/submissions\/[a-fA-F0-9]{24}\/edit$/;

  if (regex.test(url)) {
    const groupId = getActiveGroupId();
    router.push(`/groups/${groupId}`);
  } else {
    forceMobileFullscreen.value = false;
  }
}
</script>
