import store from '@/store';
import UserList from '@/pages/users/UserList.vue';
import AppHeader from '@/components/AppHeader.vue';
import FarmosManage from '@/pages/farmos-manage/FarmosManage.vue';
import AppNavigationGlobal from '@/components/AppNavigationGlobal.vue';
import UserEdit from '@/pages/users/UserEdit.vue';
import User from '@/pages/users/User.vue';

const superGuard = async (to, from, next) => {
  if (!store.getters['auth/isSuperAdmin']) {
    next({ name: 'unauthorized', query: { allowed: 'Super Admins', to: to.path } });
  } else {
    next();
  }
};

export default [
  {
    path: '/users',
    name: 'users-list',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: UserList,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
    beforeEnter: superGuard,
  },
  {
    path: '/users/new',
    name: 'users-new',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: UserEdit,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
    beforeEnter: superGuard,
  },
  {
    path: '/users/:id/edit',
    name: 'users-edit',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: UserEdit,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
    beforeEnter: superGuard,
  },
  {
    path: '/users/:id',
    name: 'users-detail',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: User,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
    beforeEnter: superGuard,
  },
  {
    path: '/farmos-manage',
    name: 'farmos-manage',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: FarmosManage,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
    beforeEnter: superGuard,
  },
];
