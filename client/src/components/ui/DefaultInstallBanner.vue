<template>
  <a-snackbar v-model="showDefaultInstall" :timeout="-1" color="primary-lighten-1" fixed bottom>
    <a-btn @click="handleClose" icon class="close-button">
      <a-icon>mdi-close</a-icon>
    </a-btn>
    <div class="text-center wrapper">
      <h2>Install App</h2>
      <div class="d-flex align-center justify-center pt-2">
        <a-btn outlined @click="install" large>
          <a-icon class="ml-n2 mr-1" small>mdi-plus</a-icon>
          Add to Homescreen
        </a-btn>
      </div>
    </div>
  </a-snackbar>
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
      window.localStorage.setItem('defaultInstallBannerDismissed', true);
      this.showDefaultInstall = false;
    },
    install() {
      this.installPrompt.prompt();
    },
    beforeInstallPrompt(e) {
      console.log('beforeinstall');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.installPrompt = e;
      // Update UI notify the user they can install the PWA
      if (!window.localStorage.getItem('defaultInstallBannerDismissed')) {
        this.showDefaultInstall = true;
      }
    },
  },
  created() {
    window.addEventListener('beforeinstallprompt', this.beforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
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
