<template>
  <a-navigation-drawer
    :modelValue="true"
    floating
    permanent
    color="rgba(0, 0, 0, 0)"
    :class="fullWidth ? 'w-100 align-center' : ''"
    :style="fullWidth ? '' : 'width:256px!important'"
    class="pt-4 mr-4">
    <SubmissionNavigation />
    <SurveyNavigation />
    <GroupAdminNavigation />
    <GroupDocsNavigation />

    <template v-slot:append>
      <AppVersion />
    </template>
  </a-navigation-drawer>
</template>

<script setup>
import ANavigationDrawer from '@/components/ui/elements/ANavigationDrawer.vue';
import SubmissionNavigation from '@/components/submissions/SubmissionNavigation.vue';
import SurveyNavigation from '@/components/survey/SurveyNavigation.vue';
import GroupAdminNavigation from '@/components/groups/GroupAdminNavigation.vue';
import GroupDocsNavigation from '@/components/groups/GroupDocsNavigation.vue';
import AppVersion from '@/components/AppVersion.vue';

const props = defineProps({
  fullWidth: {
    type: Boolean,
    required: false,
  },
});
</script>

<style scoped lang="scss">
.no-background {
  background-color: transparent;
}
</style>
