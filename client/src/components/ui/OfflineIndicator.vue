<template>
  <a-icon v-if="!isOnline" size="22" title="device is offline" color="warning" class="px-1">mdi-wifi-off</a-icon>
</template>

<script>
import { onMounted, onUnmounted, ref } from 'vue';

export default {
  setup() {
    const isOnline = ref(window.navigator.onLine);

    const handleOnlineStatus = () => {
      isOnline.value = window.navigator.onLine;
    };

    onMounted(() => {
      window.addEventListener('online', handleOnlineStatus);
      window.addEventListener('offline', handleOnlineStatus);
    });

    onUnmounted(() => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    });

    return {
      isOnline,
    };
  },
};
</script>
