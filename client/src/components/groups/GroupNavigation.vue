<template>
  <div class="ml-4 mt-4 text-white text-body-2">My Groups</div>
  <a-list dense class="px-4">
    <list-item-card
      v-for="(entity, idx) in getMyGroups({ getOnlyNotArchived: true, limit: 2 })"
      :key="entity._id"
      :entity="entity"
      :idx="String(idx)"
      :smallCard="true"
      :menu="state.menu">
      <template v-slot:entitySubtitle></template>
    </list-item-card>
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
import { reactive } from 'vue';
import { useDisplay } from 'vuetify';

import { useGroup } from '@/components/groups/group';
import ListItemCard from '@/components/ui/ListItemCard.vue';
import { getDefaultLandingPage } from '@/components/navigation';

const { getMyGroups } = useGroup();
const { mobile } = useDisplay();

const state = reactive({
  menu: [],
});

initData();

function initData() {
  state.menu = [
    {
      title: 'Go to Group',
      icon: 'mdi-open-in-new',
      action: (entity) => getDefaultLandingPage(entity._id, mobile),
      color: 'green',
    },
  ];
}
</script>

<style scoped lang="scss">
:deep(.v-list-item__content) {
  display: flex;
  align-items: center;
}
</style>
