<template>
  <div class="ml-4 mt-4 text-white text-body-2">My Groups</div>
  <a-list dense class="px-4">
    <a-list-item
      v-for="group in getMyGroups(2)"
      :key="group._id"
      @click="selectGroup(group)"
      dense
      class="bg-white mb-2"
      rounded="lg">
      <a-list-item-title>{{ group.name }}</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: '/groups/my' }"
      dense
      prepend-icon="mdi-account-group"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">All My Groups</a-list-item-title>
    </a-list-item>
  </a-list>
</template>
<script setup>
import { useGroup } from '@/components/groups/group';
import { useRouter } from 'vue-router';

const { getMyGroups } = useGroup();
const router = useRouter();

function selectGroup(group) {
  router.push(`/groups/${group._id}`);
}
</script>
