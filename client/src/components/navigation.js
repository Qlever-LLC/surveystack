import { ref } from 'vue';
const forceDesktopFullscreen = ref(false);
const forceMobileFullscreen = ref(true);

export function useNavigation() {
  function backToNavigationRoute() {}
  return {
    forceDesktopFullscreen,
    routeBackToNavigation,
  };
}
