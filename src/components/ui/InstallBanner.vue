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
import { isIosSafari, isInStandaloneMode } from '@/utils/compatibility';

export default {
  components: {
    IosInstallBanner,
    DefaultInstallBanner,
  },
  data() {
    return {
      showIosInstallBanner: false,
    };
  },
  methods: {
  },
  created() {
    if (
      isIosSafari()
      && !isInStandaloneMode()
      && !localStorage.getItem('iosInstallBannerDismissed')
    ) {
      this.showIosInstallBanner = true;
    }
  },
};
</script>

<style>

</style>
