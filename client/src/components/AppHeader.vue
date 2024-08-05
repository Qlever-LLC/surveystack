<template>
  <a-app-bar flat color="rgba(0, 0, 0, 0)" class="header-gradient">
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

    <a-expansion-panels v-else class="panels" variant="accordion" v-model="state.expanded">
      <a-expansion-panel :elevation="0" class="bg-transparent">
        <a-expansion-panel-title
          class="pa-1 pl-2 pr-7 text-white"
          css-transparent-overlay
          style="min-height: 0px !important">
          <a-list-subheader style="width: inherit" class="pr-0">
            <span style="display: flex !important; align-items: center !important">
              <a-avatar class="mr-3 entityAvatar_deepCSS" color="accent-lighten-2" rounded="lg" size="35">
                {{ state.avatarName }}
              </a-avatar>
              <span class="panelTitle" style="cursor: pointer">
                {{ state.activeGroup?.name }}
                <div class="subEntityName">
                  {{ state.selectedGroupRole }}
                </div>
              </span>
            </span>
          </a-list-subheader>
        </a-expansion-panel-title>
        <a-expansion-panel-text class="pa-0 ma-0 background">
          <a-list class="pt-0">
            <list-item-card
              v-for="(entity, idx) in state.myGroups"
              :key="entity._id"
              :entity="entity"
              :idx="String(idx)"
              :groupStyle="true"
              :menu="state.groupChooserMenu"
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
            color="accent-darken-1"
            class="text-white">
            All groups</a-btn
          >
        </a-expansion-panel-text>
      </a-expansion-panel>
    </a-expansion-panels>

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
import { useDisplay } from 'vuetify';

const store = useStore();
const router = useRouter();
const route = useRoute();
const { mobile } = useDisplay();
const { getActiveGroup, getMyGroups, isGroupAdmin, isGroupMember } = useGroup();

const props = defineProps({
  showLogo: {
    type: Boolean,
    default: false,
  },
});

const state = reactive({
  activeGroup: null,
  avatarName: '',
  expanded: false,
  myGroups: undefined,
  selectedGroupRole: computed(() => {
    if (!state.activeGroup) {
      return '';
    } else if (isGroupAdmin()) {
      return 'Admin';
    } else if (isGroupMember()) {
      return 'Member';
    } else {
      return 'Visitor';
    }
  }),
  isWhitelabel: computed(() => {
    return store.getters['whitelabel/isWhitelabel'];
  }),
  whitelabelPartner: computed(() => {
    return store.getters['whitelabel/partner'];
  }),
  groupChooserMenu: [
    {
      action: (entity) => (mobile.value ? `/groups/${entity._id}` : `/groups/${entity._id}/submissions`),
      color: 'green',
    },
  ],
});

initData();

async function initData() {
  state.activeGroup = await getActiveGroup();
  state.myGroups = getMyGroups({ getOnlyNotArchived: true }).sort((a, b) => a.path.localeCompare(b.path));

  if (state.activeGroup) {
    const name = state.activeGroup.name;
    const names = name.split(' ');
    if (names.length === 1) {
      state.avatarName = name.slice(0, 2).toUpperCase();
    } else if (names.length >= 2) {
      const premiereLettrePremierMot = names[0].charAt(0).toUpperCase();
      const premiereLettreDeuxiemeMot = names[1].charAt(0).toUpperCase();
      state.avatarName = premiereLettrePremierMot + premiereLettreDeuxiemeMot;
    } else {
      state.avatarName = '';
    }
  }
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

.help-btn {
  min-width: 0px;
  padding: 0px 8px;
}

.header-gradient {
  background: linear-gradient(#225034, rgba(0, 0, 0, 0)) !important;
}

.background {
  background: #225034 !important;
}

.panels {
  position: fixed;
  width: 285px;
  min-height: 0px !important;
  top: 0px;
  left: 8px;
  border: 2px solid;
  border-color: rgb(var(--v-theme-accent-lighten-1));
  border-radius: 8px;
  margin: 8px;
}

:deep(.v-list) {
  // activate scrollbar
  max-height: calc(80vh - 128px);
}

:deep(.v-list),
:deep(.v-list-item) {
  background-color: transparent !important;
}

:deep(.v-list-item) {
  padding: 0 !important;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 8px !important;
}

.panelTitle {
  font-weight: bold;
  font-size: 1rem;
}

.panelTitle {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.panelTitle,
:deep(.entityName_deepCSS) {
  color: white;
  line-height: normal;
}

.subEntityName {
  font-size: 0.875rem;
  font-weight: normal;
}

:deep(.subEntityName_deepCSS) {
  font-size: 0.875rem;
}

:deep(.lessContrast) {
  opacity: 0.75;
}

:deep(.moreContrast) .entityName_deepCSS {
  font-weight: bold;
}
:deep(.moreContrast) .entityAvatar_deepCSS {
  border: 2px solid white;
}

@media (max-width: 600px) {
  .panels {
    width: calc(100vw - 120px);
  }

  :deep(.entityName_deepCSS) {
    font-size: 0.875rem;
  }

  .subEntityName {
    font-size: 0.75rem;
    font-weight: normal;
  }

  :deep(.subEntityName_deepCSS) {
    font-size: 0.75rem;
  }
}
</style>
