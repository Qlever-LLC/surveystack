import { ref } from 'vue';

const forceDesktopFullscreen = ref(false);
const forceMobileFullscreen = ref(true);

export function useNavigation() {
  return {
    forceDesktopFullscreen,
    forceMobileFullscreen,
  };
}

export function getDefaultLandingPage(group, mobile) {
  return mobile.value ? `/groups/${group._id}` : `/groups/${group._id}/submissions`;
}
