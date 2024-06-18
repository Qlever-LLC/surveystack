import AppHeader from '@/components/AppHeader.vue';
import AppNavigationGroup from '@/components/AppNavigationGroup.vue';
import SurveyList from '@/pages/surveys/SurveyList.vue';
import QuestionSetList from '@/pages/surveys/QuestionSetList.vue';
import ScriptList from '@/pages/scripts/ScriptList.vue';
import GroupSettings from '@/pages/groups/GroupSettings.vue';
import Builder from '@/pages/builder/Builder.vue';
import ResultList from '@/pages/submissions/ResultList.vue';
import ScriptEdit from '@/pages/scripts/ScriptEdit.vue';
import DraftList from '@/pages/submissions/DraftsPage.vue';
import SubmissionPage from '@/pages/submissions/SubmissionPage.vue';
import SubmissionsPage from '@/pages/submissions/SubmissionsPage.vue';
import MembershipsPage from '@/pages/memberships/MembershipsPage.vue';
import MembershipEdit from '@/pages/memberships/MembershipEdit.vue';
import store from '@/store';
import FarmOS from '@/pages/groups/FarmOS.vue';

const Hylo = () => import('@/pages/groups/Hylo.vue');

export const authGuard = async (to, from, next) => {
  if (!store.getters['auth/isLoggedIn']) {
    next({ name: 'auth-login', query: { redirect: to.path } });
  } else {
    next();
  }
};

export const groupAdminGuard = async (to, from, next) => {
  if (!store.getters['auth/isLoggedIn']) {
    next({ name: 'auth-login', query: { redirect: to.path } });
  } else {
    const memberships = store.getters['memberships/memberships'];
    const groupId = to.params.id;
    const isGroupAdmin = memberships.some((m) => m.group._id === groupId && m.role === 'admin');
    if (isGroupAdmin) {
      next(); //proceed
    } else {
      //redirect to the group page
      next({ name: 'group', params: { id: groupId } });
    }
  }
};

export default [
  {
    path: '/groups/:id',
    name: 'group',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
    },
    props: { navigation: true },
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
    props: { navigation: true },
  },
  {
    path: '/groups/:id/my-drafts',
    name: 'group-my-drafts',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: DraftList,
    },
    props: { navigation: true, main: true },
  },
  {
    path: '/groups/:id/my-submissions',
    name: 'group-my-submissions',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: SubmissionsPage,
    },
    props: {
      main: {
        scope: 'user',
      },
      navigation: true,
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
    props: {
      main: {
        scope: 'group',
      },
      navigation: true,
    },
  },
  {
    path: '/groups/:id/question-sets',
    name: 'group-question-sets',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: QuestionSetList,
    },
    props: { navigation: true },
    beforeEnter: groupAdminGuard, //TODO should non-admin users be able to view the script list?
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
    props: { navigation: true },
    beforeEnter: groupAdminGuard, //TODO should non-admin users be able to view the script list?
  },
  {
    path: '/groups/:id/scripts/new',
    name: 'group-scripts-new',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: ScriptEdit,
    },
    props: { navigation: true },
    beforeEnter: groupAdminGuard,
  },
  {
    path: '/groups/:id/scripts/:scriptId/edit',
    name: 'group-scripts-edit',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: ScriptEdit,
    },
    props: { navigation: true },
    beforeEnter: groupAdminGuard,
  },
  {
    path: '/groups/:id/members',
    name: 'group-members',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: MembershipsPage,
    },
    props: { navigation: true },
    beforeEnter: groupAdminGuard,
  },
  {
    path: '/groups/:id/members/:membershipId/edit',
    name: 'group-members-edit',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: MembershipEdit,
    },
    props: { navigation: true },
    beforeEnter: groupAdminGuard,
  },
  {
    path: '/groups/:id/settings',
    name: 'group-settings',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: GroupSettings,
    },
    props: { navigation: true },
    beforeEnter: groupAdminGuard,
  },
  {
    path: '/groups/:id/farmos',
    name: 'farmos-group-manage',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: FarmOS,
    },
    props: {
      header: true,
      navigation: true,
      main: true,
    },
  },
  {
    path: '/groups/:id/hylo',
    name: 'hylo-group-manage',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: Hylo,
    },
    props: {
      header: true,
      navigation: true,
      main: true,
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
      main: (route) => ({
        id: route.params.id,
        editMode: false,
      }),
      navigation: true,
    },
    beforeEnter: groupAdminGuard,
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
      main: (route) => ({
        id: route.params.id,
        surveyId: route.params.surveyId,
        editMode: true,
      }),
      navigation: true,
    },
    beforeEnter: groupAdminGuard,
  },
  {
    path: '/groups/:id/surveys/:surveyId/submissions',
    name: 'group-survey-submissions',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: ResultList,
    },
    props: {
      main: (route) => ({
        id: route.params.id,
        surveyId: route.params.surveyId,
      }),
      navigation: true,
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
      main: (route) => ({
        id: route.params.id,
        surveyId: route.params.surveyId,
        submitAsUserId: route.query.submitAsUserId,
        routeAction: 'new',
      }),
      navigation: true,
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
    props: {
      navigation: true,
      main: route => ({
        routeAction: 'edit',
        id: route.params.id,
        surveyId: route.params.surveyId,
        submissionId: route.params.submissionId,
      }),
    },
  },
];
