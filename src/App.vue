<template>
  <v-app id="app">
    <app-navbar />
    <v-content>
      <app-global-feedback />
      <router-view :class="{'pa-3': $route.name !== 'submissions-drafts-detail'}" style="height: 100%;"></router-view>
    </v-content>
  </v-app>
</template>

<script>
import appNavbar from '@/components/Navbar.vue';
import appGlobalFeedback from '@/components/GlobalFeedback.vue';

export default {
  name: 'App',
  components: {
    appNavbar,
    appGlobalFeedback,
  },
};
</script>

<style>
@import "./css/main.css";
</style>
