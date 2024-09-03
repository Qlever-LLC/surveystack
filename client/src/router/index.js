import { createRouter, createWebHistory } from 'vue-router';
import globalRoutes from './globalRoutes.js';
import groupRoutes from './groupRoutes.js';
import superAdminRoutes from './superAdminRoutes.js';
import oldRoutes from './toBeMigratedRoutes.js';
import { useNavigation } from '@/components/navigation';

const routes = [...globalRoutes, ...groupRoutes, ...superAdminRoutes, ...oldRoutes];

const createAppRouter = () =>
  createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
    scrollBehavior(to, from, savedPosition) {
      return {
        left: 0,
        top: 0,
      };
    },
  });

const router = createAppRouter();

const { forceDesktopFullscreen, forceMobileFullscreen } = useNavigation();
// close the navigation anytime a route changes, even if the change is redundant (from and to the same path)
router.afterEach(() => {
  forceDesktopFullscreen.value = false;
  forceMobileFullscreen.value = true;
});

export { createAppRouter };
export default router;
