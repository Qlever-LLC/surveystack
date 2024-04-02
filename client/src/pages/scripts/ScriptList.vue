<template>
  <a-container>
    <basic-list
      listCard
      :entities="state.entities"
      :buttonNew="{
        title: 'Create new Script',
        link: { name: 'group-scripts-new', params: { id: getActiveGroupId() } },
      }"
      :menu="state.menu">
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
import { reactive } from 'vue';

const { getActiveGroupId, isGroupAdmin } = useGroup();

const state = reactive({
  entities: [],
  menu: [],
});

initData();

async function initData() {
  state.menu.push({
    title: 'View Script',
    icon: 'mdi-open-in-new',
    action: (e) => `/groups/${getActiveGroupId()}/scripts/${e._id}`,
    color: 'green',
  });
  if (isGroupAdmin()) {
    state.menu.push({
      title: 'Edit Script',
      icon: 'mdi-pencil',
      action: (e) => `/groups/${getActiveGroupId()}/scripts/${e._id}/edit`,
    });
  }

  const { data } = await api.get(`/scripts?groupId=${getActiveGroupId()}`);
  state.entities = data;
}
</script>
