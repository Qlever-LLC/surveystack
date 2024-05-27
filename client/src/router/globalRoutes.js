import AppHeader from '@/components/AppHeader.vue';
import AppNavigationGlobal from '@/components/AppNavigationGlobal.vue';
import LandingPage from '@/pages/LandingPage.vue';
import Kit from '@/pages/Kit.vue';
import store from '@/store';
import TabulaRasa from '@/pages/debug/TabulaRasa.vue';
import AppInfo from '@/pages/app/AppInfo.vue';
import GroupList from '@/pages/groups/GroupList.vue';
import GroupEdit from '@/pages/groups/GroupSettingsEdit.vue';
import Invitation from '@/pages/invitations/Invitation.vue';
import Profile from '@/pages/users/Profile.vue';
import FarmOSProfile from '@/pages/users/FarmOSProfile.vue';

const redirectLanding = async (to, from, next) => {
  //redirect logged in users to my-groups-list
  if (store.getters['auth/isLoggedIn']) {
    next({ name: 'my-groups-list', params: { redirect: to } });
  } else {
    //redirect not logged-in users to all-groups-list
    next({ name: 'all-groups-list', params: { redirect: to, showLogin: true } });
  }
};

export default [
  {
    path: '/',
    name: 'home',
    beforeEnter: redirectLanding,
  },
  {
    path: '/landing',
    name: 'landing',
    components: {
      header: AppHeader,
      main: LandingPage,
    },
    props: {
      header: {
        showLogo: true,
      },
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
      main: GroupEdit,
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
    path: '/farmos/profile',
    name: 'farmos-profile',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: FarmOSProfile,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
  },
  {
    path: '/app/info',
    alias: '/about',
    name: 'app-info',
    components: {
      header: AppHeader,
      main: AppInfo,
    },
  },
  {
    path: '/kit/*',
    name: 'kit',
    components: {
      header: AppHeader,
      main: Kit,
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
