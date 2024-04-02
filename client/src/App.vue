<template>
  <a-app id="app" :class="{ 'minimal-ui': $route.query.minimal_ui }" class="app-gradient">
    <router-view v-if="state.showHeader" name="header" />

    <router-view v-if="state.showNav" name="navigation" v-slot="{ Component }">
      <component :is="Component" :fullWidth="!state.showMain" />
    </router-view>

    <a-main v-if="state.showMain" style="--v-layout-left: 300px">
      <app-global-feedback />
      <router-view name="main" :key="$route.fullPath" />
    </a-main>
    <install-banner />
  </a-app>
</template>

<script setup>
import { computed, onMounted, reactive, watch } from 'vue';
import { useStore } from 'vuex';

import appGlobalFeedback from '@/components/GlobalFeedback.vue';
import domainHandler from '@/utils/domainHandler';
import api from '@/services/api.service';
import * as db from '@/store/db';
import InstallBanner from '@/components/ui/InstallBanner.vue';
import { useDisplay } from 'vuetify';
import { useRoute, useRouter } from 'vue-router';
import { useNavigation } from '@/components/navigation';

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
  showNav: computed(() => state?.routeHasHeader && !state?.fullscreen),
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

onMounted(async () => {
  domainHandler.install(store);
  // Testing: http://gm.localhost:9020/surveys/5ec83ee6c4431b000146046e
  // TODO: figure out whether we need openDb?
  db.openDb(() => {});

  fetchPinnedSurveys();
  fetchFarmOsAssets();
  // prefetch plotly which currently needs to be provided for all scripts
  // TODO with https://gitlab.com/our-sci/software/surveystack/-/issues/177, this will be replaced by fetching the union set of all pinned survey's script-dependencies
  fetch('https://cdn.plot.ly/plotly-2.18.2.min.js');

  await router.isReady();

  //const routeHasNav = !!route.matched?.[0].components?.navigation;
  //const routeHasMain = !!route.matched?.[0].components?.main;
  //showMain.value = routeHasMain;
  //console.log('----' + routeHasNav + '--' + routeHasMain.value);
});

watch(
  () => route,
  () => {
    forceDesktopFullscreen.value = false;
    forceMobileFullscreen.value = true;
  },
  { deep: true }
);

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
