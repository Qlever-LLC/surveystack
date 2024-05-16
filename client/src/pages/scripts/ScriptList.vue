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
      listType="card"
      :entities="state.entities"
      :buttonNew="{
        title: 'Create new Script',
        link: { name: 'group-scripts-new', params: { id: getActiveGroupId() } },
      }"
      :menu="state.menu"
      :loading="state.loading">
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-xml </a-icon>
        Scripts
        <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled> {{ state.entities.length }} </a-chip>
      </template>
      <template v-slot:noValue> No Scripts available </template>
    </basic-list>
  </a-container>
</template>

<script setup>
import api from '@/services/api.service';
import BasicList from '@/components/ui/BasicList2.vue';
import { useGroup } from '@/components/groups/group';
import { getPermission } from '@/utils/permissions';
import { menuAction } from '@/utils/threeDotsMenu';
import { reactive } from 'vue';

const { getActiveGroupId, isGroupAdmin } = useGroup();
const { rightToEdit, rightToView } = getPermission();
const { message, createAction } = menuAction();

const state = reactive({
  loading: false,
  entities: [],
  menu: [],
});

initData();

async function initData() {
  try {
    state.loading = true;
    state.menu.push({
      title: 'View Script',
      icon: 'mdi-open-in-new',
      action: (e) => createAction(e, rightToView, `/groups/${getActiveGroupId()}/scripts/${e._id}`),
      render: (e) => () => rightToView(e).allowed,
      color: 'green',
    });
    if (isGroupAdmin()) {
      state.menu.push({
        title: 'Edit Script',
        icon: 'mdi-pencil',
        action: (e) => createAction(e, rightToEdit, `/groups/${getActiveGroupId()}/scripts/${e._id}/edit`),
        render: (e) => () => rightToEdit(e).allowed,
      });
    }

    const { data } = await api.get(`/scripts?groupId=${getActiveGroupId()}`);
    state.entities = data;
  } finally {
    state.loading = false;
  }
}
</script>
