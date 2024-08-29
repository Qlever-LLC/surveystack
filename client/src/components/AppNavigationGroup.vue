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
      <SubmissionNavigation :id="id" :key="state.submissionNavigationKey" />
      <SurveyNavigation :key="surveyNavigationKey" />
      <GroupAdminNavigation v-if="rightToEdit().allowed" />
      <GroupDocsNavigation />
    </div>
  </a-navigation-drawer>
</template>

<script setup>
import { computed, reactive } from 'vue';

import ANavigationDrawer from '@/components/ui/elements/ANavigationDrawer.vue';
import SubmissionNavigation from '@/components/submissions/SubmissionNavigation.vue';
import SurveyNavigation from '@/components/survey/SurveyNavigation.vue';
import GroupAdminNavigation from '@/components/groups/GroupAdminNavigation.vue';
import GroupDocsNavigation from '@/components/groups/GroupDocsNavigation.vue';
import { getPermission } from '@/utils/permissions';
import { useGroup } from '@/components/groups/group';
import emitter from '@/utils/eventBus';

const { rightToEdit } = getPermission();
const { getActiveGroupId } = useGroup();

const state = reactive({
  submissionNavigationKey: undefined,
});
emitter.on('updateSubmissionNavigation', () => {
  const url = window.location.pathname;

  const regex = /^\/groups\/[a-fA-F0-9]{24}\/surveys\/[a-fA-F0-9]{24}\/submissions\/([a-fA-F0-9]{24})\/edit$/;

  const match = url.match(regex);

  if (match) {
    const submissionId = match[1];
    console.log(submissionId);
    state.submissionNavigationKey = submissionId;
  } else {
    console.log("can't refresh submission navigation");
  }
});

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
