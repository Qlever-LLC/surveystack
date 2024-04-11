import AppHeader from '@/components/AppHeader.vue';
import AppNavigationGroup from '@/components/AppNavigationGroup.vue';
import AppNavigationGlobal from '@/components/AppNavigationGlobal.vue';
import SurveysDetail from '@/pages/surveys/Detail.vue';
import Builder from '@/pages/builder/Builder.vue';
import { authGuard } from '@/router/index';
import SurveyList from '@/pages/surveys/SurveyList.vue';
import ScriptList from '@/pages/scripts/ScriptList.vue';
import GroupEdit from '@/pages/groups/GroupEdit.vue';
import Group from '@/pages/groups/Group.vue';
import ScriptEdit from '@/pages/scripts/ScriptEdit.vue';
import Script from '@/pages/scripts/Script.vue';
import SubmissionsPage from '@/pages/submissions/SubmissionsPage.vue';
import Invitation from '@/pages/invitations/Invitation.vue';

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
