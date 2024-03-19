import store from '@/store';
import UserList from '@/pages/users/UserList.vue';
import AppHeader from '@/components/AppHeader.vue';
import FarmosManage from '@/pages/farmos-manage/FarmosManage.vue';
import AppNavigationGlobal from '@/components/AppNavigationGlobal.vue';

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
    beforeEnter: superGuard,
  },
];
