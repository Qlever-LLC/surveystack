<template>
  <div class="ml-4 mt-4 text-white text-body-2">Manage {{ getActiveGroup()?.name }}</div>
  <a-list dense class="px-4">
    <a-list-item disabled dense prepend-icon="mdi-account-group" class="text-white bg-transparent mb-2" rounded="lg">
      <a-list-item-title class="text-white">Question Sets</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: '/scripts/', query: { t: Date.now() } }"
      dense
      prepend-icon="mdi-account-group"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">Scripts</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/edit/${getActiveGroupId()}`, query: { t: Date.now() } }"
      dense
      prepend-icon="mdi-account-group"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">Members</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/edit/${getActiveGroupId()}`, query: { t: Date.now() } }"
      dense
      prepend-icon="mdi-account-group"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">Settings</a-list-item-title>
    </a-list-item>
  </a-list>
</template>
<script setup>
import { useGroup } from '@/components/groups/group';

const { getActiveGroupId, getActiveGroup } = useGroup();
</script>
