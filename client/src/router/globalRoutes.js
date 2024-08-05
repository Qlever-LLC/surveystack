import AppHeader from '@/components/AppHeader.vue';
import AppNavigationGlobal from '@/components/AppNavigationGlobal.vue';
import Kit from '@/pages/Kit.vue';
import store from '@/store';
import TabulaRasa from '@/pages/debug/TabulaRasa.vue';
import GroupList from '@/pages/groups/GroupList.vue';
import Invitation from '@/pages/invitations/Invitation.vue';
import Profile from '@/pages/users/Profile.vue';
import GroupNew from '@/pages/groups/GroupNew.vue';
import Login from '@/pages/auth/Login.vue';
import Register from '@/pages/auth/Register.vue';
import ForgotPassword from '@/pages/auth/ForgotPassword.vue';
import { decode as b64Decode } from 'js-base64';
import Unauthorized from '@/pages/Unauthorized.vue';
import LandingRedirect from '@/pages/app/LandingRedirect.vue';

export default [
  {
    path: '/',
    name: 'home',
    components: {
      main: LandingRedirect,
    },
  },
  {
    path: '/invitations',
    name: 'invitations',
    components: {
      header: AppHeader,
      main: Invitation,
    },
  },
  {
    path: '/groups',
    name: 'groups',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
  },
  {
    path: '/groups/all',
    name: 'all-groups-list',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: GroupList,
    },
    props: {
      header: {
        showLogo: true,
      },
      main: {
        scope: 'all',
      },
    },
  },
  {
    path: '/groups/my',
    name: 'my-groups-list',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: GroupList,
    },
    props: {
      header: {
        showLogo: true,
      },
      main: {
        scope: 'user',
      },
    },
  },
  {
    path: '/groups/new',
    name: 'groups-new',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: GroupNew,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
  },
  {
    path: '/auth/profile',
    name: 'auth-profile',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: Profile,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
  },
  {
    path: '/auth/login',
    name: 'auth-login',
    components: {
      header: AppHeader,
      main: Login,
    },
    props: {
      main: (route) => ({ ...route.query }),
      header: {
        showLogo: true,
      },
    },
  },
  {
    path: '/auth/register',
    name: 'auth-register',
    components: {
      header: AppHeader,
      main: Register,
    },
    props: {
      main: (route) => ({ ...route.query }),
      header: {
        showLogo: true,
      },
    },
  },
  {
    path: '/auth/forgot-password',
    name: 'auth-forgot-password',
    components: {
      header: AppHeader,
      main: ForgotPassword,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
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
    components: {
      header: AppHeader,
      main: Unauthorized,
    },
    props: {
      main: (route) => ({ ...route.query }),
      header: {
        showLogo: true,
      },
    },
  },
  {
    path: '/kit/*',
    name: 'kit',
    components: {
      header: AppHeader,
      main: Kit,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
  },
  // tabula rasa
  ...(process.env.NODE_ENV === 'production'
    ? []
    : [
        {
          path: '/tabularasa',
          name: 'tabula-rasa',
          component: TabulaRasa,
        },
      ]),
];
