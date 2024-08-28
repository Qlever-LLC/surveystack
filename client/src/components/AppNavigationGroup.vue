<template>
  <a-navigation-drawer
    :modelValue="true"
    floating
    permanent
    color="rgba(0, 0, 0, 0)"
    :width="300"
    :class="fullWidth ? 'w-100 align-center' : ''"
    class="pt-4 mr-4">
    <div class="content-width">
      <SubmissionNavigation :id="id" />
      <SurveyNavigation :key="surveyNavigationKey" />
      <GroupAdminNavigation v-if="rightToEdit().allowed" />
      <GroupDocsNavigation />
    </div>
  </a-navigation-drawer>
</template>

<script setup>
import { computed } from 'vue';

import ANavigationDrawer from '@/components/ui/elements/ANavigationDrawer.vue';
import SubmissionNavigation from '@/components/submissions/SubmissionNavigation.vue';
import SurveyNavigation from '@/components/survey/SurveyNavigation.vue';
import GroupAdminNavigation from '@/components/groups/GroupAdminNavigation.vue';
import GroupDocsNavigation from '@/components/groups/GroupDocsNavigation.vue';
import { getPermission } from '@/utils/permissions';
import { useGroup } from '@/components/groups/group';

const { rightToEdit } = getPermission();
const { getActiveGroupId } = useGroup();

const props = defineProps({
  fullWidth: {
    type: Boolean,
    required: false,
  },
  id: {
    type: String,
    required: true,
  },
});

const surveyNavigationKey = computed(() => getActiveGroupId());
</script>

<style scoped lang="scss">
.content-width * {
  width: 300px !important;
}
</style>
