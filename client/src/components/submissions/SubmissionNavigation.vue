<template>
  <div class="ml-4 mt-4 text-white text-body-2">Drafts and Submissions</div>
  <a-list dense class="px-4">
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/my-drafts`, query: { t: Date.now() } }"
      dense
      prepend-icon="mdi-account-group"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">My Drafts</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/my-submissions`, query: { t: Date.now() } }"
      dense
      prepend-icon="mdi-account-group"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">My Submissions</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/submissions`, query: { t: Date.now() } }"
      dense
      prepend-icon="mdi-account-group"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">Group Submissions</a-list-item-title>
    </a-list-item>
  </a-list>
</template>
<script setup>
import { useGroup } from '@/components/groups/group';

const { getActiveGroupId } = useGroup();
</script>
