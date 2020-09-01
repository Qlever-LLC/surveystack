<template>
  <div>
    <ios-install-banner
      v-if="showIosInstallBanner"
      v-model="showIosInstallBanner"
    />
    <default-install-banner
      v-else
    />
  </div>
</template>

<script>
import IosInstallBanner from '@/components/ui/IosInstallBanner/IosInstallBanner.vue';
import DefaultInstallBanner from '@/components/ui/DefaultInstallBanner.vue';
import { isIos, isInStandaloneMode } from '@/utils/compatibility';

export default {
  components: {
    IosInstallBanner,
    DefaultInstallBanner,
  },
  data() {
    return {
      // showDefaultInstall: true,
      showIosInstallBanner: false,
    };
  },
  methods: {
  },
  created() {
    if (isIos() && isInStandaloneMode()) {
      this.showIosInstallBanner = true;
    }

    // // vvv Next line will always evaluate as true since this isn't how you access localstorage vvv
    // if (!localStorage.installed) {
    //   window.addEventListener('beforeinstallprompt', (e) => {
    //     console.log('beforeinstall');
    //     // Prevent the mini-infobar from appearing on mobile
    //     e.preventDefault();
    //     // Stash the event so it can be triggered later.
    //     this.installPrompt = e;
    //     // Update UI notify the user they can install the PWA
    //     this.showDefaultInstall = true;
    //   });

    //   window.addEventListener('appinstalled', (evt) => {
    //     localStorage.installed = true;
    //   });

    //   window.addEventListener('focus', this.focused);
    // }
  },
};
</script>

<style>

</style>
