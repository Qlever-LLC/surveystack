<template>
  <a-container>
    <a-alert
      v-if="message.errorMessage"
      style="cursor: pointer"
      type="error"
      closable
      @click:close="message.errorMessage = null">
      {{ message.errorMessage }}
    </a-alert>
    <basic-list
      @updateSearch="updateSearch"
      listCard
      questionSetsType
      :loading="state.loading"
      :entities="state.surveys.content"
      :buttonNew="
        rightToEdit().allowed
          ? {
              title: 'Create new Question Set',
              link: { name: 'group-surveys-new', query: { lib: true } },
            }
          : false
      "
      :menu="state.menu"
      :page="state.page">
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-cube-outline </a-icon>
        Question Sets
        <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled>
          {{ state.surveys.pagination.total }}
        </a-chip>
      </template>
      <template v-slot:noValue> No Question Sets available </template>
      <template v-slot:pagination>
        <a-pagination
          v-if="state.surveys.content.length > 0"
          v-model="state.page"
          :length="activeTabPaginationLength"
          @update:modelValue="() => initData()" />
      </template>
    </basic-list>
  </a-container>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { useGroup } from '@/components/groups/group';
import { getPermission } from '@/utils/permissions';
import { menuAction } from '@/utils/threeDotsMenu';

import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import formatDistance from 'date-fns/formatDistance';
import api from '@/services/api.service';

import BasicList from '@/components/ui/BasicList2.vue';

const { getActiveGroupId } = useGroup();
const { rightToView, rightToEdit } = getPermission();
const { message, createAction } = menuAction();
const PAGINATION_LIMIT = 10;

const state = reactive({
  page: 1,
  search: '',
  surveys: {
    content: [],
    pagination: {
      total: 0,
      skip: 0,
      limit: 100000,
    },
  },
  menu: [],
  showSelectMember: false,
  loading: false,
});

const activeTabPaginationLength = computed(() => {
  const { total } = state.surveys.pagination;
  return total ? Math.ceil(total / PAGINATION_LIMIT) : 0;
});

initData();

function updateSearch(val) {
  state.search = val;
  state.page = 1;
  initData();
}

async function initData() {
  state.menu = [
    {
      title: 'Description',
      icon: 'mdi-book-open',
      action: (s) => createAction(s, rightToView, `/groups/${getActiveGroupId()}/surveys/${s._id}/description`),
      render: (s) => () => rightToView().allowed,
      color: 'green',
    },
    {
      title: 'Add to New Survey',
      icon: 'mdi-file-plus',
      action: (s) =>
        createAction(s, rightToView, { path: `/groups/${getActiveGroupId()}/surveys/new`, query: { libId: s._id } }),
      render: (s) => () => rightToView().allowed,
    },
    // {
    //   title: 'View',
    //   icon: 'mdi-file-document',
    //   action: (s) => createAction(s, rightToView, `/groups/${getActiveGroupId()}/surveys/${s._id}/edit`),
    //   render: (s) => () => rightToView().allowed,
    // },
    {
      title: 'Edit',
      icon: 'mdi-pencil',
      action: (s) => createAction(s, rightToEdit, `/groups/${getActiveGroupId()}/surveys/${s._id}/edit`),
      render: (s) => () => rightToEdit().allowed,
    },
    // {
    //   title: 'Archive',
    //   icon: 'mdi-archive',
    //   action: (s) => createAction(s, rightToEdit, `/groups/${getActiveGroupId()}/surveys/${s._id}/...`),
    //   render: (s) => () => rightToEdit().allowed,
    // },
  ];

  await Promise.all([fetchData()]);
}

async function fetchData(user = null) {
  const now = new Date();
  const queryParams = new URLSearchParams();
  if (user) {
    queryParams.append('creator', user);
  }
  if (state.search) {
    queryParams.append('q', state.search);
  }

  queryParams.append('isLibrary', 'true');
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
    console.log('content', state.surveys.content);
  } catch (e) {
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
</script>
