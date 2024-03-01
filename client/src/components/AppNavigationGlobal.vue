<template>
  <a-navigation-drawer
    :modelValue="true"
    floating
    permanent
    color="rgba(0, 0, 0, 0)"
    :class="fullWidth ? 'w-100 align-center' : ''"
    :style="fullWidth ? '' : 'width:300px!important'"
    class="pt-4 pr-4">
    <a-list dense class="px-4">
      <a-list-item
        to="/groups"
        dense
        prepend-icon="mdi-compass-outline"
        class="text-white bg-primary mb-2"
        rounded="lg"
        elevation="8">
        <a-list-item-title>Find a group</a-list-item-title>
      </a-list-item>
      <a-list-item
        to="/groups/new"
        dense
        prepend-icon="mdi-account-group"
        class="text-white bg-transparent mb-2"
        rounded="lg">
        <a-list-item-title>Create a group</a-list-item-title>
      </a-list-item>
    </a-list>

    <GroupNavigation />

    <GroupDocsNavigation />

    <template v-slot:append>
      <AppVersion />
    </template>
  </a-navigation-drawer>
</template>

<script setup>
import GroupNavigation from '@/components/groups/GroupNavigation.vue';
import GroupDocsNavigation from '@/components/groups/GroupDocsNavigation.vue';
import AppVersion from '@/components/AppVersion.vue';

const props = defineProps({
  fullWidth: {
    type: Boolean,
    required: false,
  },
});
</script>

<style scoped lang="scss"></style>
