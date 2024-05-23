<template>
  <div class="ml-4 mt-4 text-white text-body-2">Manage {{ state.activeGroup?.name }}</div>
  <a-list dense class="px-4">
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/question-sets`, query: { t: Date.now() } }"
      dense
      prepend-icon="mdi-cube-outline"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">Question Sets</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/scripts`, query: { t: Date.now() } }"
      dense
      prepend-icon="mdi-xml"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">Scripts</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/members`, query: { t: Date.now() } }"
      dense
      prepend-icon="mdi-account-multiple"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">Members</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/settings`, query: { t: Date.now() } }"
      dense
      prepend-icon="mdi-cog-outline"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">Settings</a-list-item-title>
    </a-list-item>
  </a-list>
</template>
<script setup>
import { useGroup } from '@/components/groups/group';
import { reactive, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { getActiveGroupId, getActiveGroup } = useGroup();

const state = reactive({
  activeGroup: null,
});

initData();

watch(route, () => {
  initData();
});

async function initData() {
  state.activeGroup = await getActiveGroup();
}
</script>
