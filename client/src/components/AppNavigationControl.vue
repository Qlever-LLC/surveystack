<template>
  <a-btn 
    @click="handleClickSubmissionPage" 
    size="md" 
    icon 
    variant="elevated" 
    :rounded="0" 
    v-if="isSubmissionPageRoute"
  >
    <a-icon icon="mdi-close"  />
  </a-btn>
  <a-btn 
    @click="handleClickMenu" 
    size="md" 
    icon 
    variant="elevated" 
    :rounded="0"
    v-else-if="mobile"
  >
    <a-icon icon="mdi-menu" />
  </a-btn> 
</template>
<script setup>
import { useDisplay } from 'vuetify';
import { useRoute } from 'vue-router';
import { useNavigation } from '@/components/navigation';
import { computed, defineProps } from 'vue';

const props = defineProps({
  handleClickCloseCallback: {
    type: Function,
  },
})
const { mobile } = useDisplay();
const { forceMobileFullscreen } = useNavigation();
const route = useRoute();
const SUBMISSION_PAGE_ROUTE_NAME = 'group-survey-submissions-edit';
const isSubmissionPageRoute = computed(() => route.name === SUBMISSION_PAGE_ROUTE_NAME);
function handleClickSubmissionPage() {
  props.handleClickCloseCallback();
}
function handleClickMenu() {
  forceMobileFullscreen.value = false;
}
</script>
