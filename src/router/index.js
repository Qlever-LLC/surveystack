import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Test from '@/views/Test.vue';

import MySurveys from '@/views/surveys/MySurveys.vue';
import SurveysBrowse from '@/views/surveys/Browse.vue';
import SurveysDetail from '@/views/surveys/Detail.vue';
import DraftSubmission from '@/views/submissions/drafts/Draft.vue';

import Login from '@/views/auth/Login.vue';
import Register from '@/views/auth/Register.vue';
import Profile from '@/views/auth/Profile.vue';
import ForgotPassword from '@/views/auth/ForgotPassword.vue';
import ResetPassword from '@/views/auth/ResetPassword.vue';

import Experiment from '@/views/experiment/Experiments.vue';
import SandboxAR from '@/views/experiment/sandbox/SandboxAR.vue';
import SandboxMDC from '@/views/experiment/sandbox/SandboxMDC.vue';
import SandboxWG from '@/views/experiment/sandbox/SandboxWG.vue';

import UserList from '@/views/users/UserList.vue';
import User from '@/views/users/User.vue';
import UserEdit from '@/views/users/UserEdit.vue';

import GroupList from '@/views/groups/GroupList.vue';
import Group from '@/views/groups/Group.vue';
import GroupEdit from '@/views/groups/GroupEdit.vue';

import SubmissionList from '@/views/submissions/List.vue';

import Builder from '@/views/builder/Builder.vue';

import ScriptList from '@/views/scripts/ScriptList.vue';
import Script from '@/views/scripts/Script.vue';
import ScriptEdit from '@/views/scripts/ScriptEdit.vue';

import TabulaRasa from '@/views/debug/TabulaRasa.vue';


Vue.use(VueRouter);

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
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
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
  },
  {
    path: '/surveys/:id/edit',
    name: 'surveys-edit',
    component: Builder,
    props: {
      isNew: false,
    },
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
    path: '/groups/*',
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
