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
    this.$store.dispatch('surveys/fetchPinned');
    this.$store.dispatch('resources/initFromIndexedDB');

    if (this.$store.getters['auth/isLoggedIn']) {
      api.get('farmos/assets?bundle=land');
      api.get('farmos/assets?bundle=plant');
    }
  },
};
</script>

<style>
@import './css/main.css';
</style>
