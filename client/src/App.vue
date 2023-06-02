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
import InstallBanner from '@/components/ui/InstallBanner.vue';

export default {
  name: 'App',
  components: {
    appGlobalFeedback,
    InstallBanner,
  },
  created() {
    domainHandler.install(this);
  },
  mounted() {
    this.fetchPinnedSurveys();
    this.fetchFarmOsAssets();
    this.fetchMySubmissions();
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
    fetchMySubmissions() {
      this.$store.dispatch('submissions/fetchLocalDrafts').then(() => {
        this.$store.dispatch('submissions/fetchSubmissions', true);
        this.$store.dispatch('submissions/fetchSurveys');
      });
    },
  },
};
</script>

<style>
@import './css/main.css';
</style>
