<template>
  <a-app id="app" :class="{ 'minimal-ui': $route.query.minimal_ui }" class="app-gradient">
    <router-view v-if="state.showHeader" name="header" />

    <router-view v-if="state.showNav" name="navigation" v-slot="{ Component }">
      <component :is="Component" :fullWidth="!state.showMain" />
    </router-view>

    <a-main v-if="state.showMain" :style="state.showNav ? '--v-layout-left: 300px' : ''">
      <app-global-feedback />
      <router-view name="main" />
    </a-main>
    <install-banner />
  </a-app>
</template>

<script setup>
import { computed, onMounted, reactive, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { focusManager, useQueryClient } from '@tanstack/vue-query';

import appGlobalFeedback from '@/components/GlobalFeedback.vue';
import domainHandler from '@/utils/domainHandler';
import api from '@/services/api.service';
import InstallBanner from '@/components/ui/InstallBanner.vue';
import { migrateSubmissions } from './store/db';
import { useNavigation } from '@/components/navigation';
import { autoJoinWhiteLabelGroup } from '@/utils/memberships';
import { useSyncDrafts, prefetchRemoteDrafts } from './queries';

const store = useStore();
const router = useRouter();
const route = useRoute();
const { mobile } = useDisplay();
const { forceDesktopFullscreen, forceMobileFullscreen } = useNavigation();

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
  showHeader: computed(() => state?.routeHasHeader && !state?.fullscreen),
  showNav: computed(() => state?.routeHasNavigation && !state?.fullscreen),
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

const { mutate: syncDrafts, mutateAsync: syncDraftsAsync } = useSyncDrafts();
const queryClient = useQueryClient();

focusManager.subscribe((isVisible) => {
  syncDrafts();
});

onMounted(async () => {
  domainHandler.install(store);
  await migrateSubmissions();
  syncDraftsAsync()
    .then(() => {
 prefetchRemoteDrafts(queryClient); 
});

  fetchPinnedSurveys();
  fetchFarmOsAssets();
  // prefetch plotly which currently needs to be provided for all scripts
  // TODO with https://gitlab.com/our-sci/software/surveystack/-/issues/177, this will be replaced by fetching the union set of all pinned survey's script-dependencies
  fetch('https://cdn.plot.ly/plotly-2.18.2.min.js');

  await router.isReady();

  //moved from domainHandler.install
  await autoJoinWhiteLabelGroup(store);
});

const fetchPinnedSurveys = async () => {
  await store.dispatch('resources/initFromIndexedDB');
  await store.dispatch('surveys/fetchPinned');
};

const fetchFarmOsAssets = () => {
  if (store.getters['auth/isLoggedIn']) {
    api.get('farmos/farms');
    api.get('farmos/assets?bundle=land');
    api.get('farmos/assets?bundle=plant');
  }
};
</script>

<style lang="scss">
@import './css/main.css';

.app-gradient {
  background: linear-gradient(300deg, #12321f 0%, #225034 100%) !important;
}
</style>
