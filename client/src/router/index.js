import Vue from 'vue';
import VueRouter from 'vue-router';
import { decode as b64Decode } from 'js-base64';
import store from '@/store';

import Home from '@/pages/Home.vue';
import About from '@/pages/About.vue';
import Login from '@/pages/auth/Login.vue';
import Register from '@/pages/auth/Register.vue';
import ForgotPassword from '@/pages/auth/ForgotPassword.vue';
import Unauthorized from '@/pages/Unauthorized.vue';
import Invitation from '@/pages/invitations/Invitation.vue';
import UserProfile from '@/pages/users/Profile.vue';
import AppInfo from '@/pages/app/AppInfo.vue';
import CallForSubmissions from '@/pages/call-for-submissions/CallForSubmissions.vue';
import ResourceList from '@/pages/resources/ResourceList.vue';
import FarmosManage from '@/pages/farmos-manage/FarmosManage.vue';
import Kit from '@/pages/Kit.vue';
import TabulaRasa from '@/pages/debug/TabulaRasa.vue';

import groupRoutes from './group';
import membershipRoutes from './membership';
import scriptRoutes from './script';
import submissionRoutes from './submission';
import surveyRoutes from './survey';
import userRoutes from './user';
import draftRoutes from './draft';

import { getComponents, superGuard } from './helper';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'home',
    components: getComponents(Home),
  },
  {
    path: '/about',
    name: 'about',
    components: getComponents(About),
  },
  {
    path: '/auth/login',
    name: 'auth-login',
    components: getComponents(Login),
    props: true,
  },
  {
    path: '/auth/register',
    name: 'auth-register',
    components: getComponents(Register),
    props: true,
  },
  {
    path: '/auth/profile',
    name: 'auth-profile',
    components: getComponents(UserProfile),
  },
  {
    path: '/auth/forgot-password',
    name: 'auth-forgot-password',
    components: getComponents(ForgotPassword),
  },
  {
    path: '/auth/accept-magic-link',
    name: 'accept-magic-link',
    redirect: async (to) => {
      let { user, landingPath = '/', invalidateMagicLink } = to.query;
      try {
        user = JSON.parse(b64Decode(user));
      } catch (e) {
        store.dispatch('feedback/add', 'Failed to validate the login data');
        return '/auth/login?magicLinkExpired';
      }
      await store.dispatch('auth/loginWithUserObject', user);

      try {
        if (invalidateMagicLink) {
          await fetch(invalidateMagicLink);
        }
      } catch (e) {
        console.error('Failed to invalidate magic link');
      }

      landingPath = decodeURIComponent(landingPath);
      window.location.replace(`${location.origin}${landingPath}`);
    },
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    components: getComponents(Unauthorized),
    props: true,
  },
  {
    path: '/invitations',
    name: 'invitations',
    components: getComponents(Invitation),
  },
  {
    path: '/call-for-submissions',
    name: 'call-for-submissions',
    components: getComponents(CallForSubmissions),
  },
  {
    path: '/resources',
    name: 'resources-list',
    components: getComponents(ResourceList),
  },
  {
    path: '/farmos-manage',
    name: 'farmos-manage',
    components: getComponents(FarmosManage),
    beforeEnter: superGuard,
  },
  {
    path: '/app/info',
    name: 'app-info',
    components: getComponents(AppInfo),
  },
  {
    path: '/kit/*',
    name: 'kit',
    components: getComponents(Kit),
  },
  ...groupRoutes,
  ...membershipRoutes,
  ...scriptRoutes,
  ...submissionRoutes,
  ...surveyRoutes,
  ...userRoutes,
  ...draftRoutes,
];

if (process.env.NODE_ENV !== 'production') {
  routes.push({
    path: '/tabularasa',
    name: 'tabula-rasa',
    component: TabulaRasa,
  });
}

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior: () => ({ x: 0, y: 0 }),
});

export default router;
