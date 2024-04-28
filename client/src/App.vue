<template>
  <v-app id="app" :class="{ 'minimal-ui': $route.query.minimal_ui }">
    <router-view name="navbar" />
    <div id="app-menu"></div>
    <v-main>
      <app-global-feedback />
      <router-view />
    </v-main>
    <install-banner />
  </v-app>
</template>

<script>
import appGlobalFeedback from '@/components/GlobalFeedback.vue';
import domainHandler from '@/utils/domainHandler';
import api from '@/services/api.service';
import * as db from '@/store/db';
import InstallBanner from '@/components/ui/InstallBanner.vue';

db.migrateSubmissions();

export default {
  name: 'App',
  components: {
    appGlobalFeedback,
    InstallBanner,
  },
  created() {
    domainHandler.install(this);
    // Testing: http://gm.localhost:9020/surveys/5ec83ee6c4431b000146046e
    // TODO: figure out whether we need openDb?
    db.openDb(() => {});
  },
  mounted() {
    this.fetchPinnedSurveys();
    this.fetchFarmOsAssets();
    //prefetch plotly which currently needs to be provided for all scripts
    //TODO with https://gitlab.com/our-sci/software/surveystack/-/issues/177, this will be replaced by fetching the union set of all pinned survey's script-dependencies
    fetch('https://cdn.plot.ly/plotly-2.18.2.min.js');
  },
  methods: {
    async fetchPinnedSurveys() {
      await this.$store.dispatch('resources/initFromIndexedDB');
      await this.$store.dispatch('surveys/fetchPinned');
    },
    fetchFarmOsAssets() {
      if (this.$store.getters['auth/isLoggedIn']) {
        api.get('farmos/farms');
        api.get('farmos/assets?bundle=land');
        api.get('farmos/assets?bundle=plant');
      }
    },
  },
};
</script>

<style>
@import './css/main.css';
</style>
