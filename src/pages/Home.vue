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
          height="250"
        ></v-img>
        <v-img
          v-else
          :src="require('../assets/surveystack_temp_logo.svg')"
          class="my-3"
          contain
          height="250"
        ></v-img>
      </v-flex>

      <v-flex mb-4>
        <h1 class="display-2 mb-3">Welcome to SurveyStack</h1>
        <p>
          <strong>Note:</strong> This is a work in progress
        </p>

        <div
          class="text-center ma-8"
          v-if="showInstall"
        >
          <v-btn
            @click="install"
            large
            color="primary"
          >Install</v-btn>
        </div>
        <v-progress-circular
          class="mb-4"
          v-else
          color="primary"
          indeterminate
        ></v-progress-circular>

        <p class="subheading font-weight-regular">
          Source code for this application can be found here
          <br />
          <a
            href="https://gitlab.com/our-sci/our-sci-pwa"
            target="_blank"
          >Frontend</a> &
          <a
            href="https://gitlab.com/our-sci/our-sci-server"
            target="_blank"
          >Backend</a>.
        </p>
      </v-flex>

    </v-layout>
  </v-container>
</template>

<script>
// @ is an alias to /src

export default {
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
