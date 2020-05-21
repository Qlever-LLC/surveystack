<template>
  <v-container>
    <v-layout
      text-center
      wrap
    >
      <v-flex xs12>
        <v-img
          v-if="appPartner"
          :src="appPartner.logo"
          class="my-3"
          contain
          height="128"
        ></v-img>
        <v-img
          v-else
          :src="require('../assets/surveystack_temp_logo.svg')"
          class="my-3"
          contain
          height="128"
        ></v-img>
      </v-flex>

      <v-flex my-2>
        <div class="display-1">Get started with your surveys!</div>
        <app-login v-if="!isLoggedIn"></app-login>
        <div
          v-else
          class="ma-8"
        >
          <div
            v-for="(p, idx) in pinned"
            :key="'pinned_'+idx"
            class="my-2"
          >
            <v-btn
              dark
              color="primary"
              x-large
              :to="`/surveys/${p.id}`"
            >{{ p.group }}: {{ p.name }}</v-btn>
          </div>
        </div>
        <v-btn
          color="primary"
          x-large
          outlined
          :to="`/surveys/browse`"
        >Browse All</v-btn>
      </v-flex>

    </v-layout>
  </v-container>
</template>

<script>
// @ is an alias to /src

import AppLogin from '@/pages/auth/Login.vue';

export default {
  components: {
    AppLogin,
  },
  name: 'home',
  data() {
    return {
      installPrompt: {
        prompt() {
          console.log('install stub');
        },
      },
      showInstall: false,
    };
  },
  methods: {
    install() {
      this.installPrompt.prompt();
    },
  },
  computed: {
    appPartner() {
      return this.$store.getters['appui/partner'];
    },
    isLoggedIn() {
      return this.$store.getters['auth/isLoggedIn'];
    },
    pinned() {
      const pinned = this.$store.getters['surveys/getPinned'];
      console.log('pinned', pinned);
      return pinned;
    },
  },
  created() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstall');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.installPrompt = e;
      // Update UI notify the user they can install the PWA
      this.showInstall = true;
    });
  },
};
</script>
