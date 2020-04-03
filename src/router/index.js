import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '@/pages/Home.vue';
import Test from '@/pages/Test.vue';

import MySurveys from '@/pages/surveys/MySurveys.vue';
import SurveysBrowse from '@/pages/surveys/Browse.vue';
import SurveysDetail from '@/pages/surveys/Detail.vue';
import DraftSubmission from '@/pages/submissions/drafts/Draft.vue';

import Login from '@/pages/auth/Login.vue';
import Register from '@/pages/auth/Register.vue';
import Profile from '@/pages/auth/Profile.vue';
import ForgotPassword from '@/pages/auth/ForgotPassword.vue';
import ResetPassword from '@/pages/auth/ResetPassword.vue';

import Experiment from '@/pages/experiment/Experiments.vue';
import SandboxAR from '@/pages/experiment/sandbox/SandboxAR.vue';
import SandboxMDC from '@/pages/experiment/sandbox/SandboxMDC.vue';
import SandboxWG from '@/pages/experiment/sandbox/SandboxWG.vue';

import UserList from '@/pages/users/UserList.vue';
import User from '@/pages/users/User.vue';
import UserEdit from '@/pages/users/UserEdit.vue';

import GroupList from '@/pages/groups/GroupList.vue';
import Group from '@/pages/groups/Group.vue';
import GroupEdit from '@/pages/groups/GroupEdit.vue';

import SubmissionList from '@/pages/submissions/List.vue';

import Builder from '@/pages/builder/Builder.vue';

import ScriptList from '@/pages/scripts/ScriptList.vue';
import Script from '@/pages/scripts/Script.vue';
import ScriptEdit from '@/pages/scripts/ScriptEdit.vue';

import IntegrationEdit from '@/pages/integrations/IntegrationEdit.vue';
import MembershipEdit from '@/pages/memberships/MembershipEdit.vue';


import TabulaRasa from '@/pages/debug/TabulaRasa.vue';

import store from '@/store';

Vue.use(VueRouter);

const guard = async (to, from, next) => {
  if (!store.getters['auth/isLoggedIn']) {
    next({ name: 'auth-login', params: { redirect: to } });
  } else {
    next();
  }
};

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '@/pages/About.vue'),
  },
  {
    path: '/test',
    name: 'test',
    component: Test,
  },
  {
    path: '/submissions',
    name: 'submissions',
    component: SubmissionList,
  },
  {
    path: '/surveys/my-surveys',
    name: 'my-surveys',
    component: MySurveys,
  },
  {
    path: '/surveys/browse',
    name: 'surveys-browse',
    component: SurveysBrowse,
  },
  {
    path: '/surveys/new',
    name: 'surveys-new',
    component: Builder,
    props: {
      isNew: true,
    },
    beforeEnter: guard,
  },
  {
    path: '/surveys/:id/edit',
    name: 'surveys-edit',
    component: Builder,
    props: {
      isNew: false,
    },
    beforeEnter: guard,
  },
  {
    path: '/surveys/:id',
    name: 'surveys-detail',
    component: SurveysDetail,
  },

  {
    path: '/submissions/drafts/:id',
    name: 'submissions-drafts-detail',
    component: DraftSubmission,
  },
  {
    path: '/auth/login',
    name: 'auth-login',
    component: Login,
    props: true,
  },
  {
    path: '/auth/register',
    name: 'auth-register',
    component: Register,
    props: true,
  },
  {
    path: '/auth/profile',
    name: 'auth-profile',
    component: Profile,
  },
  {
    path: '/auth/forgot-password',
    name: 'auth-forgot-password',
    component: ForgotPassword,
  },
  {
    path: '/auth/reset-password',
    name: 'auth-reset-password',
    component: ResetPassword,
  },
  // experiment
  {
    path: '/experiment',
    name: 'experiment',
    component: Experiment,
  },
  {
    path: '/experiment/ar',
    name: 'experiment-ar',
    component: SandboxAR,
  },
  {
    path: '/experiment/mdc',
    name: 'experiment-mdc',
    component: SandboxMDC,
  },
  {
    path: '/experiment/wg',
    name: 'experiment-wg',
    component: SandboxWG,
  },
  // users
  {
    path: '/users',
    name: 'users-list',
    component: UserList,
  },
  {
    path: '/users/new',
    name: 'users-new',
    component: UserEdit,
  },
  {
    path: '/users/:id/edit',
    name: 'users-edit',
    component: UserEdit,
  },
  {
    path: '/users/:id',
    name: 'users-detail',
    component: User,
  },
  // groups
  {
    path: '/groups',
    name: 'groups-list',
    component: GroupList,
  },
  {
    path: '/groups/new',
    name: 'groups-new',
    component: GroupEdit,
  },
  {
    path: '/groups/edit/:id',
    name: 'groups-edit',
    component: GroupEdit,
  },
  {
    path: '/g/*',
    name: 'groups-by-path',
    component: Group,
  },
  // scripts
  {
    path: '/scripts',
    name: 'scripts-list',
    component: ScriptList,
  },
  {
    path: '/scripts/new',
    name: 'scripts-new',
    component: ScriptEdit,
  },
  {
    path: '/scripts/:id/edit',
    name: 'scripts-edit',
    component: ScriptEdit,
  },
  {
    path: '/scripts/:id',
    name: 'scripts-detail',
    component: Script,
  },
  // integrations
  {
    path: '/integrations/new',
    name: 'integrations-new',
    component: IntegrationEdit,
  },
  {
    path: '/integrations/:id/edit',
    name: 'integrations-edit',
    component: IntegrationEdit,
  },
  // memberships
  {
    path: '/memberships/new',
    name: 'memberships-new',
    component: MembershipEdit,
  },
  {
    path: '/memberships/:id/edit',
    name: 'memberships-edit',
    component: MembershipEdit,
  },
  // tabula rasa
  // TODO: remove this from production
  {
    path: '/tabularasa',
    name: 'tabula-rasa',
    component: TabulaRasa,
  },

];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});


export default router;
