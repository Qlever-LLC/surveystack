<template>
  <a-navigation-drawer
    :modelValue="true"
    floating
    permanent
    color="rgba(0, 0, 0, 0)"
    :width="300"
    :class="fullWidth ? 'w-100 align-center' : ''"
    class="pt-4 pr-4">
    <div class="content-width">
      <a-list dense class="px-4">
        <a-list-item
          :to="{ path: '/groups/all' }"
          dense
          prepend-icon="mdi-compass-outline"
          class="text-white bg-primary mb-2"
          rounded="lg"
          elevation="8">
          <a-list-item-title>Find a group</a-list-item-title>
        </a-list-item>
        <a-list-item
          :to="{ path: '/groups/new' }"
          dense
          prepend-icon="mdi-account-group"
          class="text-white bg-transparent mb-2"
          rounded="lg">
          <a-list-item-title>Create a group</a-list-item-title>
        </a-list-item>
      </a-list>
      <GroupNavigation />
      <SuperAdminNavigation v-if="store.getters['auth/isSuperAdmin']" />
    </div>
  </a-navigation-drawer>
</template>

<script setup>
import GroupNavigation from '@/components/groups/GroupNavigation.vue';
import SuperAdminNavigation from '@/components/superAdmin/SuperAdminNavigation.vue';
import { useStore } from 'vuex';

const props = defineProps({
  fullWidth: {
    type: Boolean,
    required: false,
  },
});
const store = useStore();
</script>

<style scoped lang="scss">
.content-width {
  width: 300px !important;
}
</style>
