import AppHeader from '@/components/AppHeader.vue';
import AppNavigationGroup from '@/components/AppNavigationGroup.vue';
import AppNavigationGlobal from '@/components/AppNavigationGlobal.vue';
import SurveysDetail from '@/pages/surveys/Detail.vue';
import Builder from '@/pages/builder/Builder.vue';
import { authGuard } from '@/router/index';
import MySubmissions from '@/pages/surveys/MySubmissions.vue';
import Browse from '@/pages/surveys/Browse.vue';
import ScriptList from '@/pages/scripts/ScriptList.vue';
import GroupEdit from '@/pages/groups/GroupEdit.vue';
import Group from '@/pages/groups/Group.vue';

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
    path: '/surveys/my-submissions',
    name: 'my-submissions',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: MySubmissions,
    },
  },
  {
    path: '/surveys/browse',
    name: 'surveys-browse',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: Browse,
    },
  },
  {
    path: '/scripts',
    name: 'scripts-list',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: ScriptList,
    },
  },
  {
    path: '/groups/edit/:id',
    name: 'groups-edit',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: GroupEdit,
    },
  },
  {
    path: '/surveys/:id',
    name: 'surveys-detail',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: SurveysDetail,
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
    path: '/surveys/:id/edit',
    name: 'surveys-edit',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: Builder,
    },
    props: {
      isNew: false,
    },
    beforeEnter: authGuard,
  },
  {
    path: '/surveys/:id/start',
    name: 'surveys-start',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: SurveysDetail,
    },
    props: {
      main: {
        start: true,
      },
    },
  },
  {
    path: '/surveys/:surveyId/submissions/new',
    name: 'new-submission',
    components: {
      header: AppHeader, //TODO SubmissionDraftNavbar
      navigation: AppNavigationGlobal,
      main: SurveysDetail,
    },
  },
  {
    path: '/surveys/:surveyId/submissions/:submissionId/edit',
    name: 'edit-submission',
    components: {
      header: AppHeader, //TODO SubmissionDraftNavbar
      navigation: AppNavigationGlobal,
      main: SurveysDetail,
    },
  },
];
