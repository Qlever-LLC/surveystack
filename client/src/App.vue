<template>
  <a-app id="app" class="app-gradient">
    <router-view v-if="state.showHeader" name="header" class="app-header" />

    <router-view v-if="state.showNav" name="navigation" v-slot="{ Component }" class="app-navbar">
      <component :is="Component" :fullWidth="!state.showMain" />
    </router-view>

    <a-main v-if="state.showMain" :style="state.showNav ? '--v-layout-left: 300px' : ''">
      <app-global-feedback />
      <router-view name="main" :key="uploadKey" />
    </a-main>
    <install-banner />
  </a-app>
</template>

<script setup>
import { computed, onMounted, reactive, watch, ref, provide, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { focusManager, useQueryClient } from '@tanstack/vue-query';
import emitter from '@/utils/eventBus';

import appGlobalFeedback from '@/components/GlobalFeedback.vue';
import domainHandler from '@/utils/domainHandler';
import api from '@/services/api.service';
import InstallBanner from '@/components/ui/InstallBanner.vue';
import { migrateSubmissions } from './store/db';
import { useNavigation } from '@/components/navigation';
import { autoJoinWhiteLabelGroup } from '@/utils/memberships';
import { useSyncDrafts, prefetchRemoteDrafts, usePinned } from './queries';
import { fetchSurveyWithResources } from '@/components/survey/survey';
import { useGroup } from '@/components/groups/group';

const store = useStore();
const router = useRouter();
const route = useRoute();
const { mobile } = useDisplay();
const { forceDesktopFullscreen, forceMobileFullscreen } = useNavigation();
const { getActiveGroupId } = useGroup();

const state = reactive({
  fullscreen: computed(() => {
    if (!state?.routeHasMain) {
      //no main section, fullscreen not available
      return false;
    } else {
      if (mobile.value) {
        return forceMobileFullscreen.value;
      } else {
        return forceDesktopFullscreen.value;
      }
    }
  }),
  showHeader: computed(() => state?.routeHasHeader && !state?.fullscreen && !route.query.minimal_ui),
  showNav: computed(() => state?.routeHasNavigation && !state?.fullscreen && !route.query.minimal_ui),
  showMain: computed(() => state?.routeHasMain && (!mobile.value || forceMobileFullscreen.value)),
  routeHasHeader: computed(() => {
    return !!route?.matched?.[0]?.components?.header;
  }),
  routeHasNavigation: computed(() => {
    return !!route?.matched?.[0]?.components?.navigation;
  }),
  routeHasMain: computed(() => {
    return !!route?.matched?.[0]?.components?.main;
  }),
});

const uploadKey = computed(() => getActiveGroupId());

const { mutate: syncDrafts, mutateAsync: syncDraftsAsync } = useSyncDrafts();
const queryClient = useQueryClient();

focusManager.subscribe((isVisible) => {
  syncDrafts();
});

const initFromIndexedDBReady = ref(false);
const initFromIndexedDB = async () => {
  await store.dispatch('resources/initFromIndexedDB');
  initFromIndexedDBReady.value = true;
};

const hasFetchedPinnedSurveys = ref(false);
const { data } = usePinned();

//online and offline status configuration
const onlineStatus = ref(navigator.onLine);
const updateOnlineStatus = () => {
  onlineStatus.value = navigator.onLine;
};

watch([data], async ([data]) => {
  if (data?.length && !hasFetchedPinnedSurveys.value) {
    emitter.emit('prefetchPinned', true);

    try {
      if (!initFromIndexedDBReady.value) {
        await initFromIndexedDB();
      }
      const surveyIds = data.flatMap((group) => group.pinned);

      const promises = surveyIds.map((id) => fetchSurveyWithResources(store, id));
      await Promise.all(promises);

      hasFetchedPinnedSurveys.value = true;
    } catch (error) {
      console.error('An error occurred while prefetching pinned surveys:', error);
    } finally {
      emitter.emit('prefetchPinned', false);
    }
  }
});

onMounted(async () => {
  domainHandler.install(store);
  await migrateSubmissions();
  await initFromIndexedDB();
  syncDraftsAsync().then(() => {
    prefetchRemoteDrafts(queryClient);
  });
  fetchMemberships();
  fetchFarmOsAssets();
  // prefetch plotly which currently needs to be provided for all scripts
  // TODO with https://gitlab.com/our-sci/software/surveystack/-/issues/177, this will be replaced by fetching the union set of all pinned survey's script-dependencies
  fetch('https://cdn.plot.ly/plotly-2.18.2.min.js');

  await router.isReady();

  //moved from domainHandler.install
  await autoJoinWhiteLabelGroup(store);

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});

const fetchMemberships = async () => {
  const { _id: userId } = store.getters['auth/user'];
  await store.dispatch('memberships/getUserMemberships', userId, { root: true });
};
const fetchFarmOsAssets = () => {
  if (store.getters['auth/isLoggedIn']) {
    api.get('farmos/farms');
    api.get('farmos/assets?bundle=land');
    api.get('farmos/assets?bundle=plant');
  }
};

provide('onlineStatus', onlineStatus);
</script>

<style lang="scss">
@import './css/main.css';

.app-gradient {
  background: linear-gradient(300deg, #12321f 0%, #225034 100%) !important;
}
</style>
