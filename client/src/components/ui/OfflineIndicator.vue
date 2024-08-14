<template>
  <a-icon v-if="!isOnline" size="22" title="device is offline" color="warning" class="px-1" @click="showDialog = true">
    mdi-wifi-off
  </a-icon>
  <a-icon
    v-else-if="state.pinnedLoading"
    size="22"
    title="downloading surveys for offline use"
    color="warning"
    class="px-1"
    >mdi-download</a-icon
  >
  <a-dialog v-model="showDialog" max-width="400">
    <a-card>
      <a-card-title>Device offline</a-card-title>
      <a-card-text>
        The following {{ state.pinnedSurveys.length }} pinned surveys have been downloaded and are available while
        offline:
      </a-card-text>
      <a-card-text>
        <ul class="ml-4">
          <li v-for="s in state.pinnedSurveys" :key="s._id">{{ s.name }}</li>
        </ul>
      </a-card-text>
      <a-card-actions>
        <a-spacer />
        <a-btn variant="text" @click="showDialog = false">close</a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted, watch } from 'vue';
import emitter from '@/utils/eventBus';

const isOnline = ref(window.navigator.onLine);
const showDialog = ref(false);

const state = reactive({
  pinnedLoading: false,
  pinnedSurveys: [],
});

const handleOnlineStatus = () => {
  isOnline.value = window.navigator.onLine;
};

async function countPinnedSurveysFromCache() {
  const surveyPattern = /^\/api\/surveys\/[a-fA-F0-9]{24}(?:\?version=latest)?$/;
  const cacheNames = await caches.keys();
  const matchingUrls = [];

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    for (const request of requests) {
      const url = new URL(request.url);
      if (surveyPattern.test(url.pathname + url.search)) {
        matchingUrls.push({ _id: url.pathname.split('/').pop(), name: url.pathname });
      }
    }
  }

  return matchingUrls;
}

emitter.on('prefetchPinned', (value) => (state.pinnedLoading = value));

watch(showDialog, async (newVal) => {
  if (newVal) {
    state.pinnedSurveys = await countPinnedSurveysFromCache();
  }
});

onMounted(() => {
  window.addEventListener('online', handleOnlineStatus);
  window.addEventListener('offline', handleOnlineStatus);
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnlineStatus);
  window.removeEventListener('offline', handleOnlineStatus);
});
</script>
