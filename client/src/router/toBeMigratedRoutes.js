import AppHeader from '@/components/AppHeader.vue';
import SubmissionList from '@/pages/submissions/List.vue';
import Login from '@/pages/auth/Login.vue';
import Register from '@/pages/auth/Register.vue';
import Profile from '@/pages/users/Profile.vue';
import ForgotPassword from '@/pages/auth/ForgotPassword.vue';
import { decode as b64Decode } from 'js-base64';
import store from '@/store';
import FarmOSProfile from '@/pages/users/FarmOSProfile.vue';
import UserEdit from '@/pages/users/UserEdit.vue';
import User from '@/pages/users/User.vue';
import MembershipNew from '@/pages/memberships/MembershipNew.vue';
import MembershipEdit from '@/pages/memberships/MembershipEdit.vue';
import Invitation from '@/pages/invitations/Invitation.vue';
import CallForSubmissions from '@/pages/call-for-submissions/CallForSubmissions.vue';
import ResourceList from '@/pages/resources/ResourceList.vue';
import ScriptEdit from '@/pages/scripts/ScriptEdit.vue';
import Script from '@/pages/scripts/Script.vue';
import GroupIntegrationEdit from '@/pages/integrations/GroupIntegrationEdit.vue';
import MembershipIntegrationEdit from '@/pages/integrations/MembershipIntegrationEdit.vue';
import FarmOS from '@/pages/groups/FarmOS.vue';
import Unauthorized from '@/pages/Unauthorized.vue';

const Hylo = () => import('@/pages/groups/Hylo.vue');

const commonComponents = {
  header: AppHeader,
};

function getComponents(component, mainComponents = commonComponents) {
  return {
    main: component,
    ...mainComponents,
  };
}

export default [
  {
    path: '/submissions',
    name: 'submissions',
    components: getComponents(SubmissionList),
  },

  {
    path: '/auth/login',
    name: 'auth-login',
    components: getComponents(Login),
    props: (route) => ({ ...route.query }),
  },
  {
    path: '/auth/register',
    name: 'auth-register',
    components: getComponents(Register),
    props: (route) => ({ ...route.query }),
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
    path: '/unauthorized',
    name: 'unauthorized',
    components: getComponents(Unauthorized),
    props: (route) => ({ ...route.query }),
  },
  {
    path: '/farmos/profile',
    name: 'farmos-profile',
    components: getComponents(FarmOSProfile),
  },
  // users
  {
    path: '/group-manage/farmos/:id',
    name: 'farmos-group-manage',
    props: true,
    components: getComponents(FarmOS),
  },
  {
    path: '/group-manage/hylo/:id',
    name: 'hylo-group-manage',
    props: true,
    components: getComponents(Hylo),
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
  // scripts
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
];
