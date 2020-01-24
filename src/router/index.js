import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Test from '@/views/Test.vue';

import MySurveys from '@/views/surveys/MySurveys.vue';
import BrowseSurveys from '@/views/surveys/Browse.vue';
// import DraftSurveyResult from '@/views/surveys/collect/drafts/_result_id.vue';
import DraftSubmission from '@/views/surveys/collect/drafts/_id.vue';
import DraftSurveyResult from '@/views/surveys/collect/drafts/_result_id.vue';
import SubmissionDraftsList from '@/views/submissions/drafts/List.vue';

import Login from '@/views/auth/Login.vue';
import Register from '@/views/auth/Register.vue';
import Profile from '@/views/auth/Profile.vue';

import SubmissionList from '@/views/submissions/List.vue';

import SurveyBuilder from '../views/builder/SurveyBuilder.vue';


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
    path: '/surveys/new',
    name: 'survey-builder-new',
    component: SurveyBuilder,
  },
  {
    path: '/surveys/edit/:id',
    name: 'survey-builder-edit',
    component: SurveyBuilder,
  },
  {
    path: '/surveys/my-surveys',
    name: 'my-surveys',
    component: MySurveys,
  },
  {
    path: '/surveys/browse',
    name: 'surveys-browse',
    component: BrowseSurveys,
  },
  {
    path: '/surveys/collect/start/:id',
    name: 'collect-start-survey',
    component: DraftSubmission,
  },
  {
    path: '/submissions/drafts',
    name: 'submissions-drafts-list',
    component: SubmissionDraftsList,
  },
  {
    path: '/submissions/drafts/:id',
    name: 'submissions-drafts-detail',
    component: DraftSurveyResult,
  },
  {
    path: '/auth/login',
    name: 'auth-login',
    component: Login,
  },
  {
    path: '/auth/register',
    name: 'auth-register',
    component: Register,
  },
  {
    path: '/auth/profile',
    name: 'auth-profile',
    component: Profile,
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
