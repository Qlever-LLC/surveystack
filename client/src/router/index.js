import { createRouter, createWebHistory } from 'vue-router';
import globalRoutes from './globalRoutes.js';
import groupRoutes from './groupRoutes.js';
import superAdminRoutes from './superAdminRoutes.js';
import legacyRoutes from './legacyRoutes.js';
import oldRoutes from './toBeMigratedRoutes.js';
import { useNavigation } from '@/components/navigation';

const routes = [...globalRoutes, ...groupRoutes, ...superAdminRoutes, ...legacyRoutes, ...oldRoutes];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return {
      left: 0,
      top: 0,
    };
  },
});

const { forceDesktopFullscreen, forceMobileFullscreen } = useNavigation();
// close the navigation anytime a route changes, even if the change is redundant (from and to the same path)
router.afterEach(() => {
  forceDesktopFullscreen.value = false;
  forceMobileFullscreen.value = true;
});

export default router;
