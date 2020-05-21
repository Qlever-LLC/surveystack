<template>
  <v-app id="app">
    <app-navbar />
    <v-content>
      <app-global-feedback />
      <router-view
        :class="{'pa-3': $route.name !== 'submissions-drafts-detail' || $route.name !== 'surveys-detail'}"
        style="height: 100%;"
      ></router-view>
    </v-content>
  </v-app>
</template>

<script>
/* eslint-disable no-restricted-syntax */

import appNavbar from '@/components/Navbar.vue';
import appGlobalFeedback from '@/components/GlobalFeedback.vue';
import domainHandler from '@/utils/domainHandler';
import api from '@/services/api.service';


export default {
  name: 'App',
  components: {
    appNavbar,
    appGlobalFeedback,
  },
  created() {
    domainHandler.install(this);
  },
  mounted() {
    console.log('mounted');
    this.$store.dispatch('surveys/fetchPinned');

    if (this.$store.getters['auth/isLoggedIn']) {
      api.get('farmos/fields');
      api.get('farmos/assets');
    }
    // this.$store.dispatch('surveys/fetchPinned', ),
    // fetch pinned surveys
    // for survey, prefetch
  },
};
</script>

<style>
@import "./css/main.css";
</style>
