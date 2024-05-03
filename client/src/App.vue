<template>
  <a-app id="app" :class="{ 'minimal-ui': $route.query.minimal_ui }">
    <router-view name="navbar" />
    <div id="app-menu"></div>
    <a-main>
      <app-global-feedback />
      <router-view />
    </a-main>
    <install-banner />
  </a-app>
</template>

<script>
import { onMounted } from 'vue';
import { useStore } from 'vuex';

import appGlobalFeedback from '@/components/GlobalFeedback.vue';
import domainHandler from '@/utils/domainHandler';
import api from '@/services/api.service';
import InstallBanner from '@/components/ui/InstallBanner.vue';

export default {
  name: 'App',
  components: {
    appGlobalFeedback,
    InstallBanner,
  },
  setup () {
    const store = useStore();

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

      fetchPinnedSurveys();
      fetchFarmOsAssets();
      // prefetch plotly which currently needs to be provided for all scripts
      // TODO with https://gitlab.com/our-sci/software/surveystack/-/issues/177, this will be replaced by fetching the union set of all pinned survey's script-dependencies
      fetch('https://cdn.plot.ly/plotly-2.18.2.min.js');
    });

    return {
      fetchPinnedSurveys,
      fetchFarmOsAssets,
    };
  },
};
</script>

<style>
@import './css/main.css';
</style>
