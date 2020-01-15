<template>
  <v-app>
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
