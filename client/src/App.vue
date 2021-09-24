<template>
  <v-app id="app" :class="{ 'minimal-ui': $route.query.minimal_ui }">
    <app-navbar v-if="!$route.path.includes('draft')" />
    <div id="app-menu"></div>

    <v-main v-if="!$route.path.includes('draft')">
      <app-global-feedback />
      <router-view />
    </v-main>
    <div v-else style="padding: 0; height: 100%; max-height: 100%">
      <app-global-feedback />
      <router-view />
    </div>
    <install-banner />
  </v-app>
</template>

<script>
/* eslint-disable no-restricted-syntax */

import appNavbar from '@/components/Navbar.vue';
import appGlobalFeedback from '@/components/GlobalFeedback.vue';
import domainHandler from '@/utils/domainHandler';
import api from '@/services/api.service';
import * as db from '@/store/db';
import InstallBanner from '@/components/ui/InstallBanner.vue';

export default {
  name: 'App',
  components: {
    appNavbar,
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

    if (this.$store.getters['auth/isLoggedIn']) {
      api.get('farmos/fields');
      api.get('farmos/assets');
    }
    // this.$store.dispatch('surveys/fetchPinned', ),
    // fetch pinned surveys
    // for survey, prefetch

    // TODO prefetch iframemessaging
    // fetch('/iframeMessaging.js');
    // fetch('/iframeUtils.js');
    // fetch('/iframeUI.js');
    // fetch('/iframeStyles.css');
  },
};
</script>

<style>
@import './css/main.css';
</style>
