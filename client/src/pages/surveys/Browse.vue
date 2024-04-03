<template>
  <div class="wrapper">
    <a-container>
      <basic-list
        @updateSearch="updateSearch"
        @toogleStar="toogleStar"
        listCard
        :entities="state.surveys.content"
        enableFav
        :pinnedSurveys="state.pinnedSurveys"
        :buttonNew="{ title: 'Create new Survey', link: { name: 'groups-new' } }"
        :menu="state.menu"
        :page="state.page">
        <template v-slot:title>
          <a-icon class="mr-2"> mdi-cube-outline </a-icon>
          Surveys
          <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled>
            {{ state.surveys.pagination.total }}
          </a-chip>
        </template>
        <template v-slot:noValue> No Surveys available </template>
        <template v-slot:pagination>
          <a-pagination
            v-if="state.surveys.content.length > 0"
            v-model="state.page"
            :length="activeTabPaginationLength"
            @update:modelValue="() => initData()" />
        </template>
      </basic-list>
    </a-container>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useGroup } from '@/components/groups/group';

import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import formatDistance from 'date-fns/formatDistance';
import api from '@/services/api.service';

import BasicList from '@/components/ui/BasicList2.vue';

const store = useStore();
const { getActiveGroupId, isGroupAdmin } = useGroup();
const PAGINATION_LIMIT = 10;

const state = reactive({
  page: 1,
  search: '',
  pinnedSurveys: [],
  surveys: {
    content: [],
    pagination: {
      total: 0,
      skip: 0,
      limit: 100000,
    },
  },
  menu: [],
});
const activeTabPaginationLength = computed(() => {
  const { total } = state.surveys.pagination;
  return total ? Math.ceil(total / PAGINATION_LIMIT) : 0;
});
const groups = computed(() => {
  return store.getters['memberships/groups'];
});
const isWhitelabel = computed(() => {
  return store.getters['whitelabel/isWhitelabel'];
});
const whitelabelPartner = computed(() => {
  return store.getters['whitelabel/partner'];
});

initData();

function updateSearch(val) {
  state.search = val;
  state.page = 1;
  initData();
}
async function toogleStar(entity) {
  const group = groups.value.find((g) => g._id === getActiveGroupId());
  const index = group.surveys.pinned.indexOf(entity._id);
  if (index > -1) {
    group.surveys.pinned.splice(index, 1);
  } else {
    group.surveys.pinned.push(entity._id);
  }

  await api.put(`/groups/${group._id}`, group);
  await initData();
}
async function initData() {
  state.menu.push(
    {
      title: 'Start Survey',
      icon: 'mdi-open-in-new',
      action: (e) => `/groups/${getActiveGroupId()}/surveys/${e._id}`,
      color: 'green',
    },
    {
      title: 'Start Survey as Member',
      icon: 'mdi-open-in-new',
      action: (e) => `/groups/${getActiveGroupId()}/surveys/${e._id}`,
    },
    {
      title: 'Call for Submissions',
      icon: 'mdi-bullhorn',
      action: (e) => `/groups/${getActiveGroupId()}/surveys/${e._id}`,
      render: isGroupAdmin(),
    },
    {
      title: 'Print Blank Survey',
      icon: 'mdi-open-in-new', //TODO use correct icon
      action: (e) => `/groups/${getActiveGroupId()}/surveys/${e._id}`,
    },
    {
      title: 'View',
      icon: 'mdi-file-document',
      action: (e) => `/groups/${getActiveGroupId()}/surveys/${e._id}`,
    },
    {
      title: 'Edit',
      icon: 'mdi-pencil',
      action: (e) => `/groups/${getActiveGroupId()}/surveys/${e._id}`,
      render: isGroupAdmin(),
    },
    {
      title: 'View Results',
      icon: 'mdi-chart-bar',
      action: (e) => `/groups/${getActiveGroupId()}/surveys/${e._id}`,
    },
    {
      title: 'Share',
      icon: 'mdi-share',
      action: (e) => `/groups/${getActiveGroupId()}/surveys/${e._id}`,
      render: isGroupAdmin(),
    }
  );

  // eslint-disable-next-line no-case-declarations
  const [pinnedResponse, response] = await Promise.all([
    fetchPinnedSurveys(getActiveGroupId()),
    fetchData({ groups: [getActiveGroupId()] }),
  ]);
}
async function fetchData({ user, groups = [] } = {}) {
  //  TODO create two lists, filter by active group and others
  // const groupsParam = (groups || [this.activeGroupId]).map(group => `group[]=${group}`).join('&');
  const now = new Date();
  const queryParams = new URLSearchParams();
  if (user) {
    queryParams.append('creator', user);
  }
  if (groups.length > 0) {
    groups.filter((group) => group !== null).forEach((group) => queryParams.append('groups[]', group));
  }
  if (state.search) {
    queryParams.append('q', state.search);
    console.log(state.search);
  }
  if (isWhitelabel.value) {
    queryParams.append('prefix', whitelabelPartner.value.path);
  }

  queryParams.append('skip', (state.page - 1) * PAGINATION_LIMIT);
  queryParams.append('limit', PAGINATION_LIMIT);

  try {
    const { data } = await api.get(`/surveys/list-page?${queryParams}`);
    state.surveys = data;
    state.surveys.content.forEach((s) => {
      if (s.meta) {
        const parsedDate = parseISO(s.meta.dateCreated);
        if (isValid(parsedDate)) {
          s.createdAgo = formatDistance(parsedDate, now);
        }
      }
    });
    return data;
  } catch (e) {
    // TODO: use cached data?
    console.log('Error fetching surveys:', e);
  }
  return {
    content: [],
    pagination: {
      parsedLimit: 10,
      parsedSkip: 0,
      total: 0,
    },
  };
}
async function fetchPinnedSurveys(groupId) {
  // TODO replace with new store action (?)
  try {
    console.log('fetch pinned');
    const { data } = await api.get(`/groups/${groupId}?populate=1`);
    if (data && data.surveys && data.surveys.pinned && Array.isArray(data.surveys.pinned)) {
      state.pinnedSurveys = data.surveys.pinned.map((r) => ({ ...r, pinned: true }));
      return state.pinnedSurveys.sort((a, b) => a.name.localeCompare(b.name));
    }
  } catch (err) {
    console.log('Error fetching surveys:', err);
  }
  state.pinnedSurveys = [];
  return [];
}
</script>

<style scoped lang="scss">
.wrapper {
  background-color: rgb(var(--v-theme-background));
  width: 100%;
  height: 100%;
}
</style>
