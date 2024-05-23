<template>
  <a-app-bar flat color="rgba(0, 0, 0, 0)" class="header-gradient" :class="{ topPadding: state.activeGroup }">
    <a-app-bar-title v-if="showLogo">
      <a-img
        v-if="state.isWhitelabel"
        :src="state.whitelabelPartner.hero || state.whitelabelPartner.logo"
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
      <a-expansion-panels class="panels" variant="accordion" v-model="state.expanded">
        <a-expansion-panel class="no-background">
          <a-expansion-panel-title
            class="pa-2 pr-7 text-white"
            css-transparent-overlay
            style="min-height: 0px !important">
            <a-list-subheader style="width: inherit" class="pr-0">
              <div class="text-h5 text-white font-bold nowrap" style="cursor: pointer">
                {{ state.activeGroup?.name }}
              </div>
            </a-list-subheader>
          </a-expansion-panel-title>
          <a-expansion-panel-text class="pa-0 ma-0">
            <a-list class="pt-0" style="overflow-y: auto">
              <list-item-card
                v-for="(entity, idx) in state.myGroups"
                :key="entity._id"
                :entity="entity"
                :idx="String(idx)"
                :groupStyle="true"
                :menu="[{ action: (entity) => `/groups/${entity._id}`, color: 'green' }]"
                groupSelectorStyle
                :class="{
                  lessContrast: state.activeGroup?._id !== entity?._id,
                  moreContrast: state.activeGroup?._id === entity?._id,
                  entityAvatar_deepCSS: state.activeGroup?._id === entity?._id,
                }">
              </list-item-card>
            </a-list>
            <a-btn
              @click="
                {
                  state.expanded = false;
                  router.push({ name: 'all-groups-list' });
                }
              "
              variant="flat"
              block
              class="text-white backgroundDarkgreen">
              All groups</a-btn
            >
          </a-expansion-panel-text>
        </a-expansion-panel>
      </a-expansion-panels>
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
import { computed, reactive, watch } from 'vue';
import { useStore } from 'vuex';

import NavbarUserMenu from '@/components/NavbarUserMenu.vue';
import OfflineIndicator from '@/components/ui/OfflineIndicator.vue';
import ListItemCard from '@/components/ui/ListItemCard.vue';

import { useRoute, useRouter } from 'vue-router';
import { useGroup } from '@/components/groups/group';

const store = useStore();
const router = useRouter();
const route = useRoute();
const { getActiveGroup, getMyGroups } = useGroup();

const props = defineProps({
  showLogo: {
    type: Boolean,
    default: false,
  },
});

const state = reactive({
  activeGroup: null,
  expanded: false,
  myGroups: undefined,
  isWhitelabel: computed(() => {
    return store.getters['whitelabel/isWhitelabel'];
  }),
  whitelabelPartner: computed(() => {
    return store.getters['whitelabel/partner'];
  }),
});

initData();

async function initData() {
  state.activeGroup = await getActiveGroup();
  state.myGroups = getMyGroups();
}

watch(
  route,
  () => {
    state.expanded = false;
    initData();
  },
  { deep: true }
);
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

.header-gradient {
  background: linear-gradient(#225034, rgba(0, 0, 0, 0)) !important;
}

.no-background {
  background: #225034 !important;
}

.backgroundDarkgreen {
  background-color: darkgreen;
}

.panels {
  position: fixed;
  width: 25%;
  min-width: fit-content;
  min-height: 0px !important;
  top: 8px;
  left: 8px;
  border: 1px solid #ffffff70;
  border-radius: 5px;
}

:deep(.v-list) {
  // activate scrollbar
  max-height: calc(100vh - 128px);
}

:deep(.v-list),
:deep(.v-list-item) {
  background-color: transparent !important;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 8px !important;
}

.nowrap,
:deep(.entityName_deepCSS) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.lessContrast) {
  opacity: 0.75;
}
:deep(.entityName_deepCSS) {
  color: white;
}

:deep(.moreContrast) .entityName_deepCSS {
  font-weight: bold;
}
:deep(.moreContrast) .entityAvatar_deepCSS {
  border: 2px solid white;
}

@media (max-width: 960px) {
  .topPadding {
    padding-top: 64px;
  }
  .panels {
    min-width: -webkit-fill-available;
    right: 8px;
  }
}
</style>
