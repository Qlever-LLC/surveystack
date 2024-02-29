<template>
  <a-app id="app" :class="{ 'minimal-ui': $route.query.minimal_ui }" class="app-gradient">
    <router-view name="header" />

    <router-view name="navigation" v-slot="{ Component }">
      <component :is="Component" :fullWidth="!hasCenterView" />
    </router-view>

    <a-main v-if="hasCenterView">
      <app-global-feedback />
      <router-view />
    </a-main>

    <install-banner />
  </a-app>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';

import appGlobalFeedback from '@/components/GlobalFeedback.vue';
import domainHandler from '@/utils/domainHandler';
import api from '@/services/api.service';
import * as db from '@/store/db';
import InstallBanner from '@/components/ui/InstallBanner.vue';
import AppHeader from '@/components/AppHeader.vue';

const store = useStore();

const hasCenterView = ref(true);

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

onMounted(() => {
  domainHandler.install(store);
  // Testing: http://gm.localhost:9020/surveys/5ec83ee6c4431b000146046e
  // TODO: figure out whether we need openDb?
  db.openDb(() => {});

  fetchPinnedSurveys();
  fetchFarmOsAssets();
  // prefetch plotly which currently needs to be provided for all scripts
  // TODO with https://gitlab.com/our-sci/software/surveystack/-/issues/177, this will be replaced by fetching the union set of all pinned survey's script-dependencies
  fetch('https://cdn.plot.ly/plotly-2.18.2.min.js');
});
</script>

<style lang="scss">
@import './css/main.css';

.app-gradient {
  background: linear-gradient(300deg, #12321f 0%, #225034 100%) !important;
}
</style>
