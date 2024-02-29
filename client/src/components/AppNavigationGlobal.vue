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
      <div class="text-grey">
        <p class="pt-4 pl-4">
          Version:
          <router-link to="/app/info" class="text-decoration-none" style="color: grey !important"
            >{{ lcl.shortHash }}
          </router-link>
        </p>
      </div>
    </template>
  </a-navigation-drawer>
</template>

<script setup>
import GroupNavigation from '@/components/groups/GroupNavigation.vue';
import GroupDocsNavigation from '@/components/groups/GroupDocsNavigation.vue';

const props = defineProps({
  fullWidth: {
    type: Boolean,
    required: false,
  },
});

const lcl = JSON.parse(process.env.VUE_APP_LCL);
</script>

<style scoped lang="scss"></style>
