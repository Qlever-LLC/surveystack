import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Test from '@/views/Test.vue';

import MySurveys from '@/views/surveys/MySurveys.vue';
import BrowseSurveys from '@/views/surveys/Browse.vue';
import CollectSurvey from '@/views/surveys/collect/_survey_id.vue';
import DraftSurveyResult from '@/views/surveys/collect/drafts/_result_id.vue';
import BrowseSurveyDrafts from '@/views/surveys/collect/drafts/browse.vue';

import Login from '@/views/auth/Login.vue';
import Register from '@/views/auth/Register.vue';
import Profile from '@/views/auth/Profile.vue';

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
    path: '/surveys/new',
    name: 'survey-builder-new',
    component: SurveyBuilder,
  },
  {
    path: '/surveys/my-surveys',
    name: 'my-surveys',
    component: MySurveys,
  },
  {
    path: '/surveys/browse',
    name: 'browse-surveys',
    component: BrowseSurveys,
  },
  {
    path: '/surveys/collect/:id',
    name: 'collect-survey',
    component: CollectSurvey,
  },
  {
    path: '/surveys/collect/drafts/browse',
    name: 'browse-survey-drafts',
    component: BrowseSurveyDrafts,
  },
  {
    path: '/surveys/collect/drafts/:id',
    name: 'collect-survey-draft-result',
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
