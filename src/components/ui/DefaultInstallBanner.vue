<template>
  <v-snackbar
    v-model="showDefaultInstall"
    :timeout="-1"
    color="primary lighten-1"
    fixed
    bottom
    class="snackbar"
  >
    <v-btn
      @click="handleClose"
      icon
      class="close-button"
    >
      <v-icon>mdi-close</v-icon>
    </v-btn>
    <div class="text-center wrapper">
      <h2>Install App</h2>
      <div class="d-flex align-center justify-center pt-2">
        <!-- color="accent lighten-1" -->
        <v-btn
          outlined
          @click="install"
          large
        >
          <v-icon class="ml-n2 mr-1" small>mdi-plus</v-icon>
           Add to Homescreen
        </v-btn>
      </div>
    </div>
  </v-snackbar>
</template>

<script>
export default {
  data() {
    return {
      showDefaultInstall: false,
      installPrompt: {
        prompt() {
          console.log('install stub');
        },
      },
    };
  },
  props: {
    value: Boolean,
  },
  methods: {
    handleClose() {
      // this.$emit('input', false);
      this.showDefaultInstall = false;
    },
    install() {
      this.installPrompt.prompt();
    },
    beforeInstallPrompt(e) {
      // if (!localStorage.getItem('installed')) {
      console.log('beforeinstall');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.installPrompt = e;
      // Update UI notify the user they can install the PWA
      this.showDefaultInstall = true;
      // }
    },
  },
  created() {
    window.addEventListener('beforeinstallprompt', this.beforeInstallPrompt);
    window.addEventListener('appinstalled', (evt) => {
      // localStorage.installed = true;
      // localStorage.setItem('installed', true);
    });
  },
};
</script>

<style scoped>

.close-button {
  position: absolute;
  right: 10px;
  top: 3px;
}
</style>
