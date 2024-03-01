import { createRouter, createWebHistory } from 'vue-router';
import { decode as b64Decode } from 'js-base64';
import Unauthorized from '@/pages/Unauthorized.vue';
import SurveysBrowse from '@/pages/surveys/Browse.vue';
import SurveysDetail from '@/pages/surveys/Detail.vue';
import DraftSubmission from '@/pages/submissions/drafts/Draft.vue';

import Login from '@/pages/auth/Login.vue';
import Register from '@/pages/auth/Register.vue';
import ForgotPassword from '@/pages/auth/ForgotPassword.vue';

import UserList from '@/pages/users/UserList.vue';
import User from '@/pages/users/User.vue';
import UserEdit from '@/pages/users/UserEdit.vue';
import Profile from '@/pages/users/Profile.vue';
import FarmOSProfile from '@/pages/users/FarmOSProfile.vue';
import GroupList from '@/pages/groups/GroupList.vue';
import SubmissionList from '@/pages/submissions/List.vue';

import ScriptList from '@/pages/scripts/ScriptList.vue';

import MembershipNew from '@/pages/memberships/MembershipNew.vue';
import MembershipEdit from '@/pages/memberships/MembershipEdit.vue';

import Invitation from '@/pages/invitations/Invitation.vue';

import CallForSubmissions from '@/pages/call-for-submissions/CallForSubmissions.vue';

import ResourceList from '@/pages/resources/ResourceList.vue';

import AppInfo from '@/pages/app/AppInfo.vue';
import AppHeader from '@/components/AppHeader.vue';
import SubmissionDraftNavbar from '@/components/SubmissionDraftNavbar.vue';

import TabulaRasa from '@/pages/debug/TabulaRasa.vue';
import store from '@/store';
import AppNavigationGlobal from '@/components/AppNavigationGlobal.vue';
import AppNavigationGroup from '@/components/AppNavigationGroup.vue';

const MySubmissions = () => import('@/pages/surveys/MySubmissions.vue');
const FarmosManage = () => import('@/pages/farmos-manage/FarmosManage.vue');
const GroupEdit = () => import('@/pages/groups/GroupEdit.vue');
// integrations
const MembershipIntegrationEdit = () => import('@/pages/integrations/MembershipIntegrationEdit.vue');
const GroupIntegrationEdit = () => import('@/pages/integrations/GroupIntegrationEdit.vue');
const Kit = () => import('@/pages/Kit.vue');
const Builder = () => import('@/pages/builder/Builder.vue');
const Script = () => import('@/pages/scripts/Script.vue');
const ScriptEdit = () => import('@/pages/scripts/ScriptEdit.vue');
const FarmOSGroupManage = () => import('@/pages/groups/FarmOS.vue');
const HyloGroupManage = () => import('@/pages/groups/Hylo.vue');

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

const setActiveGroup = (to, from, next) => {
  //TODO set the active group by the path param
  //store.dispatch('memberships/setActiveGroup', groupId);
  next();
};

const commonComponents = {
  header: AppHeader,
};

function getComponents(component, defaultComponents = commonComponents) {
  return {
    default: component,
    ...defaultComponents,
  };
}

const routes = [
  /*{
  //TODO in which cases does this appear?
    path: '/',
    name: 'home',
    components: getComponents(Home, {
      header: AppHeader,
    }),
  },*/
  {
    path: '/',
    name: 'home',
    components: {
      default: AppNavigationGlobal,
      header: AppHeader,
    },
    props: {
      default: {
        fullWidth: true,
      },
      header: {
        showLogo: true,
      },
    },
  },
  {
    path: '/g/:pathMatch(.*)',
    name: 'groups-by-path',
    components: {
      header: AppHeader,
      default: AppNavigationGroup,
    },
    props: {
      default: {
        fullWidth: true,
      },
    },
    beforeEnter: setActiveGroup,
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
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      default: MySubmissions,
    },
  },
  {
    path: '/surveys/browse',
    name: 'surveys-browse',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      default: SurveysBrowse,
    },
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
      },
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
    components: getComponents(DraftSubmission, { header: SubmissionDraftNavbar }),
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
    path: '/farmos/profile',
    name: 'farmos-profile',
    components: getComponents(FarmOSProfile),
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
    path: '/group-manage/farmos/:id',
    name: 'farmos-group-manage',
    props: true,
    components: getComponents(FarmOSGroupManage),
  },
  {
    path: '/group-manage/hylo/:id',
    name: 'hylo-group-manage',
    props: true,
    components: getComponents(HyloGroupManage),
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
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      default: GroupList,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
  },
  {
    path: '/groups/new',
    name: 'groups-new',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      default: GroupEdit,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
  },
  {
    path: '/groups/edit/:id',
    name: 'groups-edit',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      default: GroupEdit,
    },
  },
  // scripts
  {
    path: '/scripts',
    name: 'scripts-list',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      default: ScriptList,
    },
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
