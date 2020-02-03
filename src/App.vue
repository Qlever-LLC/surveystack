<template>
  <v-app id="app">
    <app-navbar />
    <v-content>
      <app-feedback />

      <router-view class="pa-3"></router-view>
    </v-content>
  </v-app>
</template>

<script>
import appNavbar from '@/components/Navbar.vue';
import appFeedback from '@/components/Feedback.vue';

export default {
  name: 'App',
  components: {
    appNavbar,
    appFeedback,
  },
};
</script>
<style scoped>
</style>
<style>
/*
this will avoid having to scroll down to see the footer
#app,
#app > div {
  height: 100% !important;
  min-height: 100% !important;
}
html,
body {
  height: 100%;
}
*/
</style>
