<template>
  <v-app>
    <app-navbar />

    <v-content>
      <router-view class="pa-3"></router-view>
    </v-content>
  </v-app>
</template>

<script>
import appNavbar from '@/components/Navbar.vue';

export default {
  name: 'App',
  components: {
    appNavbar,
  },
};
</script>
