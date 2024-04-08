import AppHeader from '@/components/AppHeader.vue';
import AppNavigationGroup from '@/components/AppNavigationGroup.vue';
import SurveyList from '@/pages/surveys/SurveyList.vue';
import ScriptList from '@/pages/scripts/ScriptList.vue';
import GroupEdit from '@/pages/groups/GroupEdit.vue';
import Builder from '@/pages/builder/Builder.vue';
import { authGuard } from '@/router/index';
import List from '@/pages/submissions/List.vue';
import ScriptEdit from '@/pages/scripts/ScriptEdit.vue';
import Script from '@/pages/scripts/Script.vue';
import DraftList from '@/pages/submissions/DraftsPage.vue';
import SubmissionPage from '@/pages/submissions/SubmissionPage.vue';
import SubmissionsPage from '@/pages/submissions/SubmissionsPage.vue';

export default [
  {
    path: '/groups/:id',
    name: 'group',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
    },
  },
  //lists of group resources
  {
    path: '/groups/:id/surveys',
    name: 'group-surveys',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: SurveyList,
    },
  },
  {
    path: '/groups/:id/my-drafts',
    name: 'group-my-drafts',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: DraftList,
    },
  },
  {
    path: '/groups/:id/my-submissions',
    name: 'group-my-submissions',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: SubmissionsPage,
    },
  },
  {
    path: '/groups/:id/submissions',
    name: 'group-submissions',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: SubmissionsPage,
    },
  },
  {
    path: '/groups/:id/question-sets',
    name: 'group-question-sets',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: SurveyList,
    },
  },
  //Scripts
  {
    path: '/groups/:id/scripts',
    name: 'group-scripts',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: ScriptList,
    },
  },
  {
    path: '/groups/:id/scripts/new',
    name: 'group-scripts-new',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: ScriptEdit,
    },
  },
  {
    path: '/groups/:id/scripts/:scriptId/edit',
    name: 'group-scripts-edit',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: ScriptEdit,
    },
  },
  {
    path: '/groups/:id/scripts/:scriptId',
    name: 'group-scripts-detail',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: Script,
    },
  },
  {
    path: '/groups/:id/members',
    name: 'group-members',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: GroupEdit,
    },
  },
  {
    path: '/groups/:id/settings',
    name: 'group-settings',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: GroupEdit,
    },
  },
  //edit group resource
  {
    path: '/groups/:id/surveys/new',
    name: 'group-surveys-new',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: Builder,
    },
    props: {
      isNew: false,
    },
    beforeEnter: authGuard,
  },
  {
    path: '/groups/:id/surveys/:surveyId/edit',
    name: 'group-surveys-edit',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: Builder,
    },
    props: {
      isNew: false,
    },
    beforeEnter: authGuard,
  },
  {
    path: '/groups/:id/surveys/:surveyId/submissions',
    name: 'group-survey-submissions',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: List,
    },
  },
  {
    path: '/groups/:id/surveys/:surveyId/submissions/new',
    name: 'group-survey-submissions-new',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: SubmissionPage,
    },
    props: {
      main: {
        start: true,
      },
    },
  },
  {
    path: '/groups/:id/surveys/:surveyId/submissions/:submissionId/edit',
    name: 'group-survey-submissions-edit',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: SubmissionPage,
    },
  },
];
