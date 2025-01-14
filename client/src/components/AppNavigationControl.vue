<template>
  <a-btn @click="handleClick" size="md" icon variant="elevated" :rounded="0">
    <a-icon icon="mdi-close" v-if="isSubmissionPageRoute" />
    <a-icon icon="mdi-menu" v-else-if="mobile" />
  </a-btn>
</template>
<script setup>
import { useDisplay } from 'vuetify';
import { useRouter, useRoute } from 'vue-router';
import { useNavigation } from '@/components/navigation';
import { useGroup } from '@/components/groups/group';
import { computed } from 'vue';

const { mobile } = useDisplay();
const { forceMobileFullscreen } = useNavigation();
const router = useRouter();
const route = useRoute();
const { getActiveGroupId } = useGroup();
const SUBMISSION_PAGE_ROUTE_NAME = 'group-survey-submissions-edit';
const isSubmissionPageRoute = computed(() => route.name === SUBMISSION_PAGE_ROUTE_NAME);
function handleClick() {
  if (isSubmissionPageRoute.value) {
    router.push(
      window.history.state.back ?? {
        name: 'group-surveys',
        params: getActiveGroupId(),
      }
    );
  } else {
    forceMobileFullscreen.value = false;
  }
}
</script>
