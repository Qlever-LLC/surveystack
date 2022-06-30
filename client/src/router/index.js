import Vue from 'vue';
import VueRouter from 'vue-router';
import { decode as b64Decode } from 'js-base64';
import Home from '@/pages/Home.vue';
import Test from '@/pages/Test.vue';
import Unauthorized from '@/pages/Unauthorized.vue';

const MySubmissions = () => import('@/pages/surveys/MySubmissions.vue');
import SurveysBrowse from '@/pages/surveys/Browse.vue';
import SurveysDetail from '@/pages/surveys/Detail.vue';
import DraftSubmission from '@/pages/submissions/drafts/Draft.vue';

import Login from '@/pages/auth/Login.vue';
import Register from '@/pages/auth/Register.vue';
import Profile from '@/pages/auth/Profile.vue';
import ForgotPassword from '@/pages/auth/ForgotPassword.vue';

import UserList from '@/pages/users/UserList.vue';
import User from '@/pages/users/User.vue';
import UserEdit from '@/pages/users/UserEdit.vue';

const FarmosManage = () => import('@/pages/farmos-manage/FarmosManage.vue');

import GroupList from '@/pages/groups/GroupList.vue';
import Group from '@/pages/groups/Group.vue';
const GroupEdit = () => import('@/pages/groups/GroupEdit.vue');

import SubmissionList from '@/pages/submissions/List.vue';

import ScriptList from '@/pages/scripts/ScriptList.vue';

import MembershipNew from '@/pages/memberships/MembershipNew.vue';
import MembershipEdit from '@/pages/memberships/MembershipEdit.vue';

import Invitation from '@/pages/invitations/Invitation.vue';

import CallForSubmissions from '@/pages/call-for-submissions/CallForSubmissions.vue';

import ResourceList from '@/pages/resources/ResourceList.vue';

import AppInfo from '@/pages/app/AppInfo.vue';

// integrations
const MembershipIntegrationEdit = () => import('@/pages/integrations/MembershipIntegrationEdit.vue');
const GroupIntegrationEdit = () => import('@/pages/integrations/GroupIntegrationEdit.vue');

import Navbar from '@/components/Navbar.vue';
import SubmissionDraftNavbar from '@/components/SubmissionDraftNavbar.vue';

import TabulaRasa from '@/pages/debug/TabulaRasa.vue';
const Kit = () => import('@/pages/Kit.vue');
import store from '@/store';

const Builder = () => import('@/pages/builder/Builder.vue');
const Script = () => import('@/pages/scripts/Script.vue');
const ScriptEdit = () => import('@/pages/scripts/ScriptEdit.vue');

Vue.use(VueRouter);

const guard = async (to, from, next) => {
  if (!store.getters['auth/isLoggedIn']) {
    next({ name: 'auth-login', params: { redirect: to } });
  } else {
    next();
  }
};

const superGuard = async (to, from, next) => {
  if (!store.getters['auth/isSuperAdmin']) {
    next({ name: 'unauthorized', params: { allowed: 'Super Admins', to } });
  } else {
    next();
  }
};

const commonComponents = {
  navbar: Navbar,
};

function getComponents(component, defaultComponents = commonComponents) {
  return {
    default: component,
    ...defaultComponents,
  };
}

const routes = [
  {
    path: '/',
    name: 'home',
    components: getComponents(Home),
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    components: getComponents(() => import(/* webpackChunkName: "about" */ '@/pages/About.vue')),
  },
  {
    path: '/submissions',
    name: 'submissions',
    components: getComponents(SubmissionList),
  },
  {
    path: '/surveys/my-submissions',
    name: 'my-submissions',
    components: getComponents(MySubmissions),
  },
  {
    path: '/surveys/browse',
    name: 'surveys-browse',
    components: getComponents(SurveysBrowse),
  },
  {
    path: '/surveys/new',
    name: 'surveys-new',
    components: getComponents(Builder),
    props: {
      isNew: true,
    },
    beforeEnter: guard,
  },
  {
    path: '/surveys/:id/edit',
    name: 'surveys-edit',
    components: getComponents(Builder),
    props: {
      isNew: false,
    },
    beforeEnter: guard,
  },
  {
    path: '/surveys/:id/start',
    name: 'surveys-start',
    components: getComponents(SurveysDetail),
    props: {
      default: {
        start: true,
      }
    },
  },
  {
    path: '/surveys/:id',
    name: 'surveys-detail',
    components: getComponents(SurveysDetail),
  },
  {
    path: '/submissions/drafts/:id',
    name: 'submissions-drafts-detail',
    components: getComponents(DraftSubmission, { navbar: SubmissionDraftNavbar }),
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
    components: getComponents(Profile),
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
      let { user, landingPath = '/' } = to.query;
      try {
        user = JSON.parse(b64Decode(user));
      } catch (e) {
        store.dispatch('feedback/add', 'Failed to validate the login data');
        return '/auth/login?magicLinkExpired';
      }
      landingPath = decodeURIComponent(landingPath);
      await store.dispatch('auth/loginWithUserObject', user);

      window.location.replace(`${location.origin}${landingPath}`);
    },
  },
  // users
  {
    path: '/users',
    name: 'users-list',
    components: getComponents(UserList),
    beforeEnter: superGuard,
  },
  {
    path: '/farmos-manage',
    name: 'farmos-manage',
    components: getComponents(FarmosManage),
    beforeEnter: superGuard,
  },
  {
    path: '/users/new',
    name: 'users-new',
    components: getComponents(UserEdit),
  },
  {
    path: '/users/:id/edit',
    name: 'users-edit',
    components: getComponents(UserEdit),
  },
  {
    path: '/users/:id',
    name: 'users-detail',
    components: getComponents(User),
  },
  // groups
  {
    path: '/groups',
    name: 'groups-list',
    components: getComponents(GroupList),
  },
  {
    path: '/groups/new',
    name: 'groups-new',
    components: getComponents(GroupEdit),
  },
  {
    path: '/groups/edit/:id',
    name: 'groups-edit',
    components: getComponents(GroupEdit),
  },
  {
    path: '/g/*',
    name: 'groups-by-path',
    components: getComponents(Group),
  },
  // scripts
  {
    path: '/scripts',
    name: 'scripts-list',
    components: getComponents(ScriptList),
  },
  {
    path: '/scripts/new',
    name: 'scripts-new',
    components: getComponents(ScriptEdit),
  },
  {
    path: '/scripts/:id/edit',
    name: 'scripts-edit',
    components: getComponents(ScriptEdit),
  },
  {
    path: '/scripts/:id',
    name: 'scripts-detail',
    components: getComponents(Script),
  },
  // integrations
  {
    path: '/group-integrations/new',
    name: 'group-integrations-new',
    components: getComponents(GroupIntegrationEdit),
  },
  {
    path: '/group-integrations/:id/edit',
    name: 'group-integrations-edit',
    components: getComponents(GroupIntegrationEdit),
  },
  {
    path: '/membership-integrations/new',
    name: 'membership-integrations-new',
    components: getComponents(MembershipIntegrationEdit),
  },
  {
    path: '/membership-integrations/:id/edit',
    name: 'membership-integrations-edit',
    components: getComponents(MembershipIntegrationEdit),
  },
  // memberships
  {
    path: '/memberships/new',
    name: 'memberships-new',
    components: getComponents(MembershipNew),
  },
  {
    path: '/memberships/:id/edit',
    name: 'memberships-edit',
    components: getComponents(MembershipEdit),
  },
  // Invitation
  {
    path: '/invitations',
    name: 'invitations',
    components: getComponents(Invitation),
  },
  // Request submissions
  {
    path: '/call-for-submissions',
    name: 'call-for-submissions',
    components: getComponents(CallForSubmissions),
  },
  // Resources
  {
    path: '/resources',
    name: 'resources-list',
    components: getComponents(ResourceList),
  },
  // Unauthorized
  {
    path: '/unauthorized',
    name: 'unauthorized',
    components: getComponents(Unauthorized),
    props: true,
  },
  // App-Info
  {
    path: '/app/info',
    name: 'app-info',
    components: getComponents(AppInfo),
  },
  // tabula rasa
  ...(process.env.NODE_ENV === 'production'
    ? []
    : [
        {
          path: '/tabularasa',
          name: 'tabula-rasa',
          component: TabulaRasa,
        },
      ]),
  {
    path: '/kit/*',
    name: 'kit',
    components: getComponents(Kit),
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior(to, from, savedPosition) {
    return {
      x: 0,
      y: 0,
    };
  },
});

export default router;
