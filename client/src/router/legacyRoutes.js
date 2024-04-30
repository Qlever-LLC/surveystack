import AppHeader from '@/components/AppHeader.vue';
import AppNavigationGroup from '@/components/AppNavigationGroup.vue';
import AppNavigationGlobal from '@/components/AppNavigationGlobal.vue';
import Builder from '@/pages/builder/Builder.vue';
import Group from '@/pages/groups/Group.vue';
import SubmissionsPage from '@/pages/submissions/SubmissionsPage.vue';
import store from '@/store';

export const authGuard = async (to, from, next) => {
  if (!store.getters['auth/isLoggedIn']) {
    next({ name: 'auth-login', query: { redirect: to.path } });
  } else {
    next();
  }
};

export default [
  {
    //TODO redirect this to the groups page at /groups/:id (so we need to aquire the id somehow...
    path: '/g/:pathMatch(.*)',
    name: 'groups-by-path',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: Group,
    },
  },
  {
    path: '/surveys/new',
    name: 'surveys-new',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: Builder,
    },
    props: {
      isNew: true,
    },
    beforeEnter: authGuard,
  },
  {
    //TODO test
    path: '/surveys/:id/start',
    name: 'surveys-start',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: SubmissionsPage,
    },
    props: {
      main: {
        start: true,
      },
    },
  },
  {
    //TODO remove or test
    path: '/surveys/:surveyId/submissions/new',
    name: 'new-submission',
    components: {
      header: AppHeader, //TODO SubmissionDraftNavbar
      navigation: AppNavigationGlobal,
      main: SubmissionsPage,
    },
  },
  {
    //TODO remove or test
    path: '/surveys/:surveyId/submissions/:submissionId/edit',
    name: 'edit-submission',
    components: {
      header: AppHeader, //TODO SubmissionDraftNavbar
      navigation: AppNavigationGlobal,
      main: SubmissionsPage,
    },
  },
];
