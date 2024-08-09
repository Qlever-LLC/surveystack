<template>
  <a-icon v-if="!isOnline" size="22" title="device is offline" color="warning" class="px-1" @click="showDialog = true">
    mdi-wifi-off
  </a-icon>
  <a-icon v-else-if="pinnedLoading" size="22" title="downloading surveys for offline use" color="warning" class="px-1"
    >mdi-download</a-icon
  >
  <a-dialog v-model="showDialog" max-width="400">
    <a-card>
      <a-card-title>Device offline</a-card-title>
      <a-card-text>
        The following {{ pinnedSurveys.length }} pinned surveys have been downloaded and are available while offline:
      </a-card-text>
      <a-card-text>
        <ul class="ml-4">
          <li v-for="s in pinnedSurveys" :key="s._id">{{ s.name }}</li>
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
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useStore } from 'vuex';
import { cloneDeep } from 'lodash';

const store = useStore();
const isOnline = ref(window.navigator.onLine);
const showDialog = ref(false);
const pinnedLoading = computed(() => store.getters['surveys/getPinnedLoading']);
const pinnedSurveys = computed(() => {
  const s = store.getters['surveys/getPinned'];
  let sCloned = cloneDeep(s);
  sCloned.sort((a, b) => a.name.localeCompare(b.name));
  return sCloned;
});

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
</script>
