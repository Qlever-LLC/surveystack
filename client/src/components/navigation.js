import { ref } from 'vue';
const forceDesktopFullscreen = ref(false);
const forceMobileFullscreen = ref(true);

export function useNavigation() {
  return {
    forceDesktopFullscreen,
    forceMobileFullscreen,
  };
}
