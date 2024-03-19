import globalRoutes from './globalRoutes.js';
import groupRoutes from './groupRoutes.js';
import superAdminRoutes from './superAdminRoutes.js';
import legacyRoutes from './legacyRoutes.js';
import oldRoutes from './oldRoutes.js';

import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';

export const authGuard = async (to, from, next) => {
  if (!store.getters['auth/isLoggedIn']) {
    next({ name: 'auth-login', query: { redirect: to.path } });
  } else {
    next();
  }
};

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

export default router;
