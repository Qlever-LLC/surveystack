import AppHeader from '@/components/AppHeader.vue';
import SubmissionList from '@/pages/submissions/List.vue';
import Login from '@/pages/auth/Login.vue';
import Register from '@/pages/auth/Register.vue';
import ForgotPassword from '@/pages/auth/ForgotPassword.vue';
import { decode as b64Decode } from 'js-base64';
import store from '@/store';
import ResourceList from '@/pages/resources/ResourceList.vue';
import GroupIntegrationEdit from '@/pages/integrations/GroupIntegrationEdit.vue';
import MembershipIntegrationEdit from '@/pages/integrations/MembershipIntegrationEdit.vue';
import Unauthorized from '@/pages/Unauthorized.vue';

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
  // Resources
  {
    path: '/resources',
    name: 'resources-list',
    components: getComponents(ResourceList),
  },
];
