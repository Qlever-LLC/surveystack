<template>
  <a-container class="basicListContainer">
    <a-card :loading="state.isLoadingGroup" color="background">
      <a-card-title class="text-heading d-flex pa-1">
        <a-col align="start" class="flex-grow-0">
          <AppNavigationControl />
        </a-col>
        <a-col class="flex-grow-1 pl-0" :class="'text-center'">
          <a-icon class="mr-2" icon="mdi-cog-outline" />
          Settings
          <a-chip v-if="isPremium" class="ml-2" color="success" rounded="lg" variant="flat" disabled>
            <a-icon small left> mdi-octagram </a-icon>Premium
          </a-chip>
        </a-col>
      </a-card-title>
      <a-card-text class="mt-5">
        <group-edit scope="edit" @changed="groupChanged" />
      </a-card-text>
      <basic-list
        listType="card"
        :showNavigationControl="false"
        :entities="state.subgroups"
        :loading="state.isLoadingGroup"
        groupStyle
        title="Subgroups"
        :menu="state.subgroupMenu"
        :buttonNew="{ title: 'new...', link: { name: 'groups-new', query: { dir: state.entity.path } } }">
        <template v-slot:entityTitle="{ entity }"> {{ entity.name }} ! {{ entity.path }} </template>
        <template v-slot:filter>
          <a-checkbox v-model="state.showArchived" label="View archived" dense hide-details color="primary" />
        </template>
        <template v-slot:noValue> No Groups available </template>
      </basic-list>
      <basic-list
        listType="card"
        :showNavigationControl="false"
        :entities="integrations"
        title="Integrations"
        :menu="[
          {
            title: 'Go to',
            icon: 'mdi-open-in-new',
            action: (integration) => `/groups/${state.entity._id}/${integration.slug}`,
            color: 'green',
          },
        ]">
        <template v-slot:entitySubtitle="{ entity }">
          {{ entity.description }}
        </template>
      </basic-list>

      <app-doc-links class="ma-4" :group="state.entity"></app-doc-links>
    </a-card>
  </a-container>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import api from '@/services/api.service';
import { useDisplay } from 'vuetify';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import appDocLinks from '@/components/groups/DocLinks.vue';
import BasicList from '@/components/ui/BasicList2.vue';
import { SPEC_VERSION_GROUP } from '@/constants';
import GroupEdit from '@/components/groups/GroupEdit.vue';
import AppNavigationControl from '@/components/AppNavigationControl.vue';
import ACardText from '@/components/ui/elements/ACardText.vue';

const { mobile } = useDisplay();
const store = useStore();
const route = useRoute();

import { getDefaultLandingPage } from '@/components/navigation';

const integrations = [
  {
    name: 'FarmOS',
    description: 'Manage FarmOS integration',
    slug: `farmos`, // used for the link /group-manage/farmos/$GROUP_ID
  },
  {
    name: 'Hylo',
    description: 'Manage Hylo integration',
    slug: `hylo`, // used for the link /group-manage/farmos/$GROUP_ID
  },
];

const state = reactive({
  entity: {
    meta: {
      archived: false,
      specVersion: SPEC_VERSION_GROUP,
      invitationOnly: true,
    },
    name: '',
    slug: '',
    dir: '/',
    path: '',
    surveys: {
      pinned: [],
    },
  },
  subgroups: [],
  showArchived: false,
  searchResults: [],
  isLoadingGroup: false,

  subgroupMenu: [
    {
      title: 'Go to Group',
      icon: 'mdi-open-in-new',
      action: (e) => getDefaultLandingPage(e._id, mobile),
      color: 'green',
    },
  ],
});

const isWhitelabel = computed(() => {
  return store.getters['whitelabel/isWhitelabel'];
});
const whitelabelPartner = computed(() => {
  return store.getters['whitelabel/partner'];
});
const isPremium = computed(() => {
  if (
    isWhitelabel.value &&
    (state.entity.path.startsWith(whitelabelPartner.value.path) ||
      state.entity.dir.startsWith(whitelabelPartner.value.path))
  ) {
    return true;
  }
  return false;
});

onCreation();

async function searchSurveys(q) {
  const { data: searchResults } = await api.get(`/surveys?projections[]=name&projections[]=meta.dateModified&q=${q}`);
  state.searchResults = searchResults;
}
async function getSubgroups() {
  try {
    const { data } = await api.get(`/groups/all?showArchived=${state.showArchived}&dir=${state.entity.path}`);
    state.subgroups = data;
  } catch (e) {
    this.status.code = e.response.status;
    this.status.message = e.response.data.message;
  }
}
async function groupChanged() {
  await getSubgroups();
}

async function onCreation() {
  const { dir } = route.query;
  if (dir) {
    state.entity.dir = dir;
    if (!state.entity.dir.endsWith('/')) {
      state.entity.dir += '/';
    }
  }

  state.isLoadingGroup = true;
  try {
    const { id } = route.params;
    const { data } = await api.get(`/groups/${id}?populate=true`);
    state.entity = { ...state.entity, ...data };
    await getSubgroups();
  } catch (e) {
    console.log('something went wrong:', e);
  } finally {
    state.isLoadingGroup = false;
  }
}

watch(
  () => state.showArchived,
  async function () {
    state.isLoadingGroup = true;
    await getSubgroups();
    state.isLoadingGroup = false;
  }
);
</script>

<style scoped lang="scss">
.api-border {
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 4px;
}

.revertPadding {
  padding: revert;
}
</style>
