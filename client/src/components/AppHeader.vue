<template>
  <a-app-bar flat color="rgba(0, 0, 0, 0)" class="header-gradient">
    <a-app-bar-title v-if="showLogo">
      <a-img
        v-if="isWhitelabel"
        :src="whitelabelPartner.hero || whitelabelPartner.logo"
        class="my-3"
        width="200"
        height="60"
        @click="router.push('/')"
        style="cursor: pointer" />
      <a-img
        v-else
        :src="require('../assets/logo-white.png')"
        class="my-3"
        contain
        width="200"
        height="40"
        @click="router.push('/')"
        style="cursor: pointer" />
    </a-app-bar-title>

    <a-app-bar-title v-else>
      <!-- todo replace by group chooser button -->
      <div class="text-h5 text-white font-bold">{{ getActiveGroup()?.name }}</div>
    </a-app-bar-title>

    <a-spacer />
    <offline-indicator />
    <a-btn
      class="help-btn"
      variant="text"
      href="https://our-sci.gitlab.io/software/surveystack_tutorials/"
      target="_blank">
      <a-icon size="22" color="white">mdi-help-circle-outline</a-icon>
    </a-btn>
    <navbar-user-menu />
  </a-app-bar>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import NavbarUserMenu from '@/components/NavbarUserMenu.vue';
import OfflineIndicator from '@/components/ui/OfflineIndicator.vue';
import { useRouter } from 'vue-router';
import { useGroup } from '@/components/groups/group';

const store = useStore();
const router = useRouter();
const { getActiveGroup } = useGroup();

const props = defineProps({
  showLogo: {
    type: Boolean,
    default: false,
  },
});

const isWhitelabel = computed(() => {
  return store.getters['whitelabel/isWhitelabel'];
});
const whitelabelPartner = computed(() => {
  return store.getters['whitelabel/partner'];
});
</script>
<style scoped lang="scss">
.fixed-bar {
  position: sticky;
  position: -webkit-sticky; /* for Safari */
  top: 6em;
  z-index: 2;
}

.help-btn.v-btn:not(.v-btn--round).v-size--default {
  min-width: 0px;
  padding: 0px 8px;
}
</style>

<style scoped lang="scss">
.header-gradient {
  background: linear-gradient(#225034, rgba(0, 0, 0, 0)) !important;
}
</style>
