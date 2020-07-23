<template>
  <v-container>
    <v-row>
      <v-col>
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
      </v-col>
    </v-row>

    <v-row>
      <v-col align="center">
        <app-basic-list
          class="mw-40 text-left"
          v-if="pinned && pinned.length > 0"
          :entities="pinned"
          title="Get started with your surveys!"
          linkNew="/surveys/browse"
          labelNew="View all..."
          :link="e => `/surveys/${e.id}`"
          editable
        >
          <template v-slot:entity="{ entity }">
            <v-list-item-content>
              <v-list-item-title>{{entity.name}}</v-list-item-title>
              <v-list-item-subtitle>{{entity.group}}</v-list-item-subtitle>

            </v-list-item-content>
          </template>
        </app-basic-list>
      </v-col>
    </v-row>

    <app-login v-if="!isLoggedIn"></app-login>

    <v-row>
      <v-col align="center">
        <v-btn
          x-large
          text
          :to="`/surveys/browse`"
        >Browse All Surveys</v-btn>
      </v-col>
    </v-row>

    <v-row v-if="showInstall">
      <v-col align="center">
        <v-btn
          color="primary"
          x-large
          @click="install"
        >Install App</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col align="center">
        <v-chip
          style="font-family: monospace"
          to="/app/info"
        >v{{ version }}</v-chip>
      </v-col>
    </v-row>

  </v-container>
</template>

<script>
// @ is an alias to /src

import AppLogin from '@/pages/auth/Login.vue';
import AppBasicList from '@/components/ui/BasicList.vue';

export default {
  components: {
    AppLogin,
    AppBasicList,
  },
  name: 'home',
  data() {
    return {
      installPrompt: {
        prompt() {
          console.log('install stub');
        },
      },
      version: process.env.VUE_APP_VERSION,
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
      return pinned;
    },
  },
  created() {
    if (!localStorage.installed) {
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('beforeinstall');
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        this.installPrompt = e;
        // Update UI notify the user they can install the PWA
        this.showInstall = true;
      });

      window.addEventListener('appinstalled', (evt) => {
        localStorage.installed = true;
      });
    }
  },
};
</script>
