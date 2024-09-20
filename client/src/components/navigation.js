import { ref } from 'vue';

const forceDesktopFullscreen = ref(false);
const forceMobileFullscreen = ref(true);

export function useNavigation() {
  return {
    forceDesktopFullscreen,
    forceMobileFullscreen,
  };
}

export function getDefaultLandingPage(groupId, mobile) {
  return mobile.value ? `/groups/${groupId}` : `/groups/${groupId}/surveys`;
}
