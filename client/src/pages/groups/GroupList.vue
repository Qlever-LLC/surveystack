<template>
  <a-container class="basicListContainer">
    <basic-list
      listType="card"
      :entities="state.entities"
      :loading="state.loading"
      groupStyle
      :buttonNew="{ title: 'Create a Group', link: { name: 'groups-new', query: { dir: rootDir } } }"
      :menu="[{ title: 'Go to Group', icon: 'mdi-open-in-new', action: (e) => `/groups/${e._id}`, color: 'green' }]">
      <template v-slot:title>
        <template v-if="onlyMyGroups()"><a-icon class="mr-2 mt-n1">mdi-account-group</a-icon>All my groups</template>
        <template v-else> <a-icon class="mr-2">mdi-compass-outline</a-icon>Find a group</template>
        <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled> {{ state.entities.length }} </a-chip>
      </template>
      <template v-slot:filter>
        <a-checkbox v-model="state.showArchived" label="View archived" dense hide-details color="primary" />
      </template>
      <template v-slot:noValue> No Groups available </template>
    </basic-list>
  </a-container>
</template>

<script setup>
import api from '@/services/api.service';
import BasicList from '@/components/ui/BasicList2.vue';
import { reactive, watch } from 'vue';
import { useGroup } from '@/components/groups/group';
import { useRoute } from 'vue-router';
import store from '@/store';

const route = useRoute();
const { isWhitelabel, getWhitelabelPartner } = useGroup();

const state = reactive({
  entities: [],
  showArchived: false,
  loading: false,
});

fetchEntities();

async function fetchEntities() {
  try {
    state.loading = true;
    if (isWhitelabel()) {
      const { path } = getWhitelabelPartner();
      const { data: entities } = await api.get(`/groups/all?showArchived=${state.showArchived}&prefix=${path}`);
      state.entities = entities;
      return;
    }

    if (onlyMyGroups()) {
      const myGroups = store.getters['memberships/groups'];
      state.entities = myGroups.sort((a, b) => a.path.localeCompare(b.path));
    } else {
      const { data: entities } = await api.get(`/groups/all?showArchived=${state.showArchived}`);
      state.entities = entities.sort((a, b) => a.path.localeCompare(b.path));
    }
  } finally {
    state.loading = false;
  }
}

function onlyMyGroups() {
  return route.matched.some(({ name }) => name === 'my-groups-list');
}

function rootDir() {
  if (isWhitelabel()) {
    return getWhitelabelPartner().path;
  }
  return '/';
}

watch(
  () => state.showArchived,
  async () => {
    await fetchEntities();
  }
);
</script>
