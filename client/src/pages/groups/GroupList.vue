<template>
  <a-container class="basicListContainer">
    <basic-list
      listType="card"
      :entities="state.entities"
      :loading="state.loading"
      groupStyle
      :buttonNew="{ title: 'Create a Group', link: { name: 'groups-new', query: { dir: rootDir() } } }"
      :menu="[
        {
          title: 'Go to Group',
          icon: 'mdi-open-in-new',
          action: (entity) => (mobile ? `/groups/${entity._id}` : `/groups/${entity._id}/submissions`),
          color: 'green',
        },
      ]">
      <template v-slot:title>
        <template v-if="props.scope === 'user'">
          <a-icon class="mr-2 mt-n1">mdi-account-group</a-icon>All my groups
        </template>
        <template v-else> <a-icon class="mr-2">mdi-compass-outline</a-icon>Find a group</template>
        <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled> {{ state.entities.length }} </a-chip>
      </template>
      <template v-slot:filter>
        <a-checkbox v-model="state.showArchived" label="View archived" dense hide-details color="primary" />
      </template>
      <template v-slot:noValue> No Groups available </template>
    </basic-list>
  </a-container>
  <a-dialog v-model="state.showAuthSelector" :width="mobile ? '100%' : '50%'">
    <auth-selector @skip="skipAuth" />
  </a-dialog>
</template>

<script setup>
import api from '@/services/api.service';
import BasicList from '@/components/ui/BasicList2.vue';
import { reactive, watch } from 'vue';
import { useGroup } from '@/components/groups/group';
import store from '@/store';
import { useDisplay } from 'vuetify';
import { useRoute, useRouter } from 'vue-router';
import AuthSelector from '@/components/ui/AuthSelector.vue';

const { mobile } = useDisplay();
const router = useRouter();
const route = useRoute();

const props = defineProps({
  scope: {
    type: String,
    required: true,
    validator(value) {
      return ['all', 'user'].includes(value);
    },
  },
});

const { isWhitelabel, getWhitelabelPartner } = useGroup();

const state = reactive({
  entities: [],
  showArchived: false,
  loading: false,
  showAuthSelector: false,
});

initData();

watch([() => state.showArchived, () => props.scope], initData);

watch(
  () => route.query.login,
  () => (route.query.login ? (state.showAuthSelector = true) : (state.showAuthSelector = false))
);

async function initData() {
  if (route.query.login) {
    state.showAuthSelector = true;
  }
  try {
    state.loading = true;
    if (isWhitelabel()) {
      const { path } = getWhitelabelPartner();
      const { data: entities } = await api.get(`/groups/all?showArchived=${state.showArchived}&prefix=${path}`);
      state.entities = entities;
      return;
    }

    if (props.scope === 'user') {
      const myGroups = store.getters['memberships/groups'];
      const filteredMyGroups = myGroups.filter((g) => (state.showArchived ? g.meta.archived : !g.meta.archived));
      state.entities = filteredMyGroups.sort((a, b) => a.path.localeCompare(b.path));
    } else {
      const { data: entities } = await api.get(`/groups/all?showArchived=${state.showArchived}`);
      state.entities = entities.sort((a, b) => a.path.localeCompare(b.path));
    }
  } finally {
    state.loading = false;
  }
}

function rootDir() {
  if (isWhitelabel()) {
    return getWhitelabelPartner().path;
  }
  return '/';
}

function skipAuth() {
  state.showAuthSelector = false;
  router.push({ query: null });
}
</script>
