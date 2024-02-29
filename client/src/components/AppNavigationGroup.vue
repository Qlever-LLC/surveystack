<template>
  <a-navigation-drawer
    :modelValue="true"
    floating
    permanent
    color="rgba(0, 0, 0, 0)"
    :class="fullWidth ? 'w-100 align-center' : ''"
    :style="fullWidth ? '' : 'width:300px!important'"
    class="pt-4 pr-4">
    <SubmissionNavigation />
    <SurveyNavigation />
    <GroupAdminNavigation />
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
import { useGroup } from '@/components/groups/group';
import ANavigationDrawer from '@/components/ui/elements/ANavigationDrawer.vue';
import SubmissionNavigation from '@/components/submissions/SubmissionNavigation.vue';
import SurveyNavigation from '@/components/survey/SurveyNavigation.vue';
import GroupAdminNavigation from '@/components/groups/GroupAdminNavigation.vue';
import GroupDocsNavigation from '@/components/groups/GroupDocsNavigation.vue';

const props = defineProps({
  fullWidth: {
    type: Boolean,
    required: false,
  },
});

const lcl = JSON.parse(process.env.VUE_APP_LCL);
</script>

<style scoped lang="scss">
.no-background {
  background-color: transparent;
}
</style>
